import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useState, useEffect } from 'react';
import { Page, Card, AppProvider, InlineStack, List, Checkbox, BlockStack } from '@shopify/polaris';
import moment from 'moment';
import { getPersistentPrayerData, storePersistentPrayerData, getPrayersData, persistentPrayerData } from '../module/db.js';
import { json } from '@remix-run/node';
import { useLoaderData, useSubmit, useFetcher } from '@remix-run/react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const getCookie = request.headers.get('Cookie');
  const prayerData = getPrayersData();
  const getPersistentPrayer = getPersistentPrayerData();
  // const storePersistentData = getPersistentPrayerData();
  if (!getCookie) {
    return redirect("/setting");
  }
  return json({ prayerData, getPersistentPrayer });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.json();
  persistentPrayerData(data);
  return {}
}

type PrayerData = {
  timings: Timings,
  date: {
    readable: string,
  }
}

type Timings = {
  Fajr: string,
  Dhuhr: string,
  Asr: string,
  Maghrib: string,
  Isha: string,
}

type PersistentData = {
  date: string,
  timings: Array<persistenTimings>
}

type persistenTimings = {
  id: number,
  label: string,
  time: string,
  isCompleted: boolean,
}

const GLOBAL_DATE_FORMAT = 'YYYY-MM-DD';

const App = () => {
  const [date, setDate] = useState(moment().format(GLOBAL_DATE_FORMAT));
  const [currentDataPersistentIndex, setCurrentDatePersistentIndex] = useState(-1);
  const [dateLabel, setDateLabel] = useState(new Date().toLocaleDateString("en-GB", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }))
  const [data, setData] = useState<Array<PrayerData>>([]);
  const [timings, setTimings] = useState<Array<persistenTimings>>([]);
  const [loading, setLoading] = useState(false);
  const { prayerData, getPersistentPrayer } = useLoaderData<typeof loader>();
  const submit = useSubmit()
  const prepareTimings = (prayerData: Array<PrayerData>, persistentData: PersistentData | null) => {
    console.log('Hello World', persistentData);
    const modifiedData = moment(date).format('DD');
    const current: PrayerData = prayerData[parseInt(modifiedData) - 1];
    const _timings: Array<persistenTimings> = [];
    const excludedTimingKeys = ['Sunrise', 'Sunset', 'Imsak', 'Midnight', 'Lastthird', 'Firstthird'];
    for (var key in current.timings) {
      const id: number = _timings.length + 1;
      if (excludedTimingKeys.indexOf(key) == -1) {
        _timings.push({
          id: id,
          label: key,
          time: current.timings[key as keyof Timings],
          isCompleted: persistentData?.timings?.find((timing: persistenTimings) => key === timing.label)?.isCompleted ?? false,
        })
      }
    }
    setTimings(_timings);
    setDateLabel(current.date.readable);
  }
  useEffect(() => {
    if (!data.length) {
      const { data: prayersData } = prayerData;
      const persistentData: Array<PersistentData> | [] = getPersistentPrayer ?? [];
      const currentDateIndex: number = persistentData?.findIndex(data => date == data?.date);
      let persistentResult: PersistentData | null = null;
      if (currentDateIndex > -1) {
        setCurrentDatePersistentIndex(currentDateIndex);
        persistentResult = persistentData[currentDateIndex];
      }
      setData(prayersData);
      prepareTimings(prayersData, persistentResult);
    }
  }, []);

  useEffect(() => {
    if (data.length) {
      const persistentData: Array<PersistentData> | [] = getPersistentPrayer ?? [];
      const currentDateIndex: number = persistentData?.findIndex((data: any) => date == data?.date);
      let persistentResult: PersistentData | null = null;
      if (currentDateIndex > -1) {
        setCurrentDatePersistentIndex(currentDateIndex);
        persistentResult = persistentData[currentDateIndex];
      } else {
        setCurrentDatePersistentIndex(-1);
      }
      prepareTimings(data, persistentResult);
    }
  }, [date]);

  const handleCompleteSalat = (index: number) => {
    const timing: persistenTimings = { ...timings[index] };
    timing.isCompleted = !timing.isCompleted;
    timings[index] = timing;
    const persistentData: Array<PersistentData> = getPersistentPrayer ?? [];
    if (currentDataPersistentIndex > -1) {
      const data: PersistentData = persistentData[currentDataPersistentIndex];
      const prayerIndex: number = data?.timings?.findIndex(timing => timing.label == timings[index].label);
      if (prayerIndex > -1) {
        data.timings[prayerIndex].isCompleted = timings[index].isCompleted;
      } else {
        data?.timings?.push(timings[index]);
      }
      persistentData[currentDataPersistentIndex] = data;
    } else {
      persistentData.push({
        date: date,
        timings: [
          timings[index]
        ]
      });
      setCurrentDatePersistentIndex(persistentData.length - 1);
    }
    submit(persistentData, { method: "POST", encType: "application/json" });
    setTimings([...timings]);
  }
  return (
    <AppProvider i18n={{}}>
      <Page
        narrowWidth
        title={dateLabel}
        pagination={{
          hasPrevious: true,
          onPrevious: () => {
            setDate(moment(date).subtract(1, 'days').format(GLOBAL_DATE_FORMAT))
          },
          hasNext: true,
          onNext: () => {
            setDate(moment(date).add(1, 'days').format(GLOBAL_DATE_FORMAT))
          }
        }}
      >

        {timings?.map((timing, index) => (
          <BlockStack gap="500" align='center'>
            <Card padding={{ xs: '100' }}>
              <InlineStack wrap={true} gap="100" align="space-between" blockAlign="center">
                <List type="bullet" >
                  <List.Item>{timing.label}</List.Item>
                </List>
                <List type="bullet">
                  <List.Item>{timing.time}</List.Item>
                </List>
                <List type="bullet">
                  <List.Item>{date > moment().format(GLOBAL_DATE_FORMAT) || date < moment().format(GLOBAL_DATE_FORMAT) ? <Checkbox label="" onChange={() => handleCompleteSalat(index)} disabled checked={timing.isCompleted}></Checkbox> : <Checkbox label="" onChange={() => handleCompleteSalat(index)} checked={timing.isCompleted}></Checkbox>}</List.Item>
                </List>
              </InlineStack>
            </Card>
          </BlockStack>
        ))}
      </Page>
    </AppProvider>

  );
};
export default App;
