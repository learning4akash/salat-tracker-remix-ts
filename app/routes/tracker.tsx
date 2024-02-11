import { redirect } from '@remix-run/node';
import { useState, useEffect } from 'react';
import {Page, Card, AppProvider, InlineStack, List, Checkbox, BlockStack} from '@shopify/polaris';
import moment from 'moment';
import { getPersistentPrayerData, storePersistentPrayerData, getPrayersData, persistentPrayerData } from '../module/db.js';
import { json } from '@remix-run/node';
import { useLoaderData, useSubmit, useFetcher } from '@remix-run/react';

export const loader = async ({ request }) => {
  const getCookie  = request.headers.get('Cookie');
  const prayerData =  getPrayersData();
  const getPersistentPrayer = getPersistentPrayerData();
  // const storePersistentData = getPersistentPrayerData();
  if (!getCookie) {
    return redirect("/setting");
  } 
  return json({prayerData, getPersistentPrayer});
}

export const action = async ({ request }) => {
  const data = await request.json();
  persistentPrayerData(data, 'const');
  return {}
}


const GLOBAL_DATE_FORMAT = 'YYYY-MM-DD';   

const App = () => {
  const [date, setDate] = useState(moment().format(GLOBAL_DATE_FORMAT));
  const [currentDataPersistentIndex, setCurrentDatePersistentIndex] = useState(-1);
  const [dateLabel, setDateLabel]= useState(new Date().toLocaleDateString("en-GB", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }))
  const [data, setData] = useState([]); 
  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(false);
  const { prayerData, getPersistentPrayer } = useLoaderData();
  const submit = useSubmit()
  const prepareTimings = (prayerData, persistentData) => {
    console.log('prayer data', prayerData);
    console.log('persisten data ', persistentData);
    const modifiedData = moment(date).format('DD');
    const current      = prayerData[modifiedData - 1];
    const _timings = [];
    const excludedTimingKeys = ['Sunrise', 'Sunset', 'Imsak', 'Midnight', 'Lastthird', 'Firstthird'];
    for(var key in current.timings) {
        const id = _timings.length + 1;
      if (excludedTimingKeys.indexOf(key) == -1) {
        _timings.push({
          id: id,
          label: key,
          time: current.timings[key],
          isCompleted: persistentData?.timings?.find(timing => key === timing.label)?.isCompleted ?? false, 
        })
      }
    }
    setTimings(_timings);
    setDateLabel(current.date.readable);
  }
  useEffect(() => {
    if (!data.length) {
       const { data: prayersData } = prayerData;
      const persistentData         =  getPersistentPrayer ?? [];
      const currentDateIndex       = persistentData?.findIndex(data => date == data?.date);
      let persistentResult = {};
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
      const persistentData   = getPersistentPrayer ?? [];
      const currentDateIndex = persistentData?.findIndex(data => date == data?.date);
      let persistentResult   = {};
      if (currentDateIndex > -1) {
        setCurrentDatePersistentIndex(currentDateIndex);
        persistentResult = persistentData[currentDateIndex];
      } else {
        setCurrentDatePersistentIndex(-1);
      }
      prepareTimings(data, persistentResult);
    }
  }, [date]);

  const handleCompleteSalat = (index) => {
    const timing = {...timings[index]};
    timing.isCompleted = !timing.isCompleted;
    timings[index] = timing; 
    const persistentData = getPersistentPrayer ?? [];
    if (currentDataPersistentIndex > -1) {
      const data = persistentData[currentDataPersistentIndex];
      const prayerIndex = data?.timings?.findIndex(timing => timing.label == timings[index].label);
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
        onPrevious : () => {
          setDate(moment(date).subtract(1, 'days').format(GLOBAL_DATE_FORMAT))
        },
        hasNext: true,
        onNext: () => {
          setDate(moment(date).add(1, 'days').format(GLOBAL_DATE_FORMAT))
        }
      }}
    >
      
            {timings?.map((timing, index)=> ( 
               <BlockStack gap="500" align='center'> 
               <Card padding= {{xs: '100'}}>
                <InlineStack wrap={true} gap="100" align="space-between" blockAlign="center">
                <List type="bullet" >
                  <List.Item>{timing.label}</List.Item>
                </List>
                <List type="bullet">
                  <List.Item>{timing.time}</List.Item>
                </List>
                <List type="bullet">
                    <List.Item>{ date > moment().format(GLOBAL_DATE_FORMAT) || date < moment().format(GLOBAL_DATE_FORMAT) ? <Checkbox onChange={() => handleCompleteSalat(index)} disabled  checked={timing.isCompleted}></Checkbox> : <Checkbox onChange={() => handleCompleteSalat(index)}  checked={timing.isCompleted}></Checkbox>}</List.Item>
                </List>
                </InlineStack>
              </Card>  
            </BlockStack>
           )) }
    </Page>
    </AppProvider>
   
  );
};
export default App;
