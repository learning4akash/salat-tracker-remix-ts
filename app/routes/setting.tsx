import { json } from '@remix-run/node';
import { FormLayout, TextField, BlockStack, AppProvider, Form, Button, Select, Page, Card, InlineError } from '@shopify/polaris';
import { City, Country } from 'country-state-city';
import { ICountry, ICity } from 'country-state-city'
import type { ActionFunctionArgs } from '@remix-run/node';
import {
  useLoaderData,
  useSubmit,
  useFetcher,
  useActionData,
} from '@remix-run/react';
import { useEffect, useState, useCallback } from 'react';
import { getPrayerTimeCalculationMethods, getPrayerTimeData } from '../module/api';
import { getUserData, storeUserData, storePrayersData, getPrayersData } from '../module/db.js';
import { validationAction } from '../utils.js';
import { z } from "zod";
import { redirect } from '@remix-run/node';

const schema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: " Name must be a string",
  }).min(2, { message: "Name is Required" }),
  country: z.string({
    required_error: "Country is required",
    invalid_type_error: " Country must be a string",
  }).min(1, { message: "Country is Required" }),
  city: z.string({
    required_error: "City is required",
    invalid_type_error: " City must be a string",
  }).optional(),
  mazhab: z.string({
    required_error: "Mazhab is required",
    invalid_type_error: "Mazhab must be a string",
  }).min(1, { message: "Mazhab is Required" }),
  salat_method: z.string({
    required_error: "Salat Method is required",
    invalid_type_error: "Method must be a string",
  }).min(1, { message: "Salat Method is Required" }),
})

type ActionInput = z.TypeOf<typeof schema>

type UserData = {
  name: string,
  country: string,
  city?: string,
  mazhab: string,
  salat_method: string,
}
type SalatMethod = {
  name: string,
  id: number
}

const userDataObj = {
  name: '',
  country: '',
  city: '',
  mazhab: '',
  salat_method: ''
}

export const loader = async () => {
  const countries: ICountry[] = await Country.getAllCountries();
  const userData: UserData | undefined = getUserData();
  return json(
    {
      userData,
      countries,
      getPrayerCalMethods: await getPrayerTimeCalculationMethods(),
    }
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { formData, errors } = await validationAction<ActionInput>({
    request,
    schema
  });
  console.log({ errors });
  if (errors) return json({ formData, errors });
  const prayerTimeData = await getPrayerTimeData(formData);
  if (formData && prayerTimeData) {
    storePrayersData(prayerTimeData);
    storeUserData(formData);
    return redirect('/tracker', {
      headers: {
        "Set-Cookie": "1",
      },
    });
  }
}

export default function App() {
  const cityFetcher = useFetcher<Array<ICity>>({ key: 'fetch-cities' });
  const submit = useSubmit();
  const [country, setCountry] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string | undefined>('');
  const [city, setCity] = useState<Array<ICity>>([]);
  const [slectCity, setSelectCity] = useState<string | undefined>('');
  const [name, setName] = useState<string>('');
  const [mazhab, setMazhab] = useState('');
  const [salatMethods, setSalatMethods] = useState<Array<SalatMethod>>([]);
  const [selectSalatMethod, setSelectSalatMethod] = useState<string>('');
  const [formUserData, setFormUserData] = useState<UserData>(userDataObj);
  const [userInfo, setUserInfo] = useState<UserData | {}>({});
  const actionData = useActionData<typeof action>();
  const { countries, getPrayerCalMethods, userData } = useLoaderData<typeof loader>();
  const optionMazhab: Array<{ label: string, value: string }> = [
    { label: "Shafi", value: "0" },
    { label: "Hanafi", value: "1" },
    { label: "Maliki", value: "2" },
    { label: "Hanbali", value: "3" },
  ]
  const handleSubmit = useCallback(() => {
    submit(formUserData, { method: "POST", encType: "application/json" })
  }, [formUserData]);

  useEffect(() => {
    setFormUserData({ ...formUserData, name: name, country: country, city: slectCity, mazhab: mazhab, salat_method: selectSalatMethod });
  }, [name, country, slectCity, mazhab, selectSalatMethod]);

  useEffect(() => {
    if (userData) {
      setFormUserData(userData);
      setName(userData.name);
      setCountry(userData.country);
      setMazhab(userData.mazhab);
      setSelectCity(userData.city);
      setSelectSalatMethod(userData.salat_method);
    }
  }, [userData]);
  console.log("Hello",slectCity);

  const handleSelectChange = useCallback((value: string) => {
    const selectedCountryCode = countries.find((e) => e.name === value)
    if (selectedCountryCode) {
      const isoCode = selectedCountryCode.isoCode;
      cityFetcher.load(`/cities/${isoCode}`)
      setCountryCode(isoCode);
      setCountry(value);
      setCity([]);
    }
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setSelectCity(value);
  }, []);

  const handleMazhabChange = useCallback((value: string) => {
    setMazhab(value);
  }, [])

  const handleSalatMethodsChange = (value: string) => {
    setSelectSalatMethod(value);
  }
  useEffect(() => {
    if (salatMethods) {
      setSalatMethods(Object.values(getPrayerCalMethods.data));
    }
  }, []);
  useEffect(() => {
    if (!Object.keys(userInfo).length) {
      if (userData) {
        const findCountry = countries.find(country => country.name == userData.country);
        if (findCountry) {
          cityFetcher.load(`/cities/${findCountry.isoCode}`);
          setCountryCode(findCountry.isoCode);
        }
      }
      if (userData) {
        setUserInfo(userData);
      }
    }
  }, [])
  useEffect(() => {
    if (cityFetcher.state === 'idle' && cityFetcher?.data?.length) {
      setCity(cityFetcher.data);
    }
  }, [cityFetcher]);
  return (
    <>
      <AppProvider i18n={{}}>
        <Page fullWidth={true}>
          <BlockStack inlineAlign="center" gap="800" as='div'>
            <div style={{ height: "400px", width: "400px" }}>
              <Card padding={{ xs: '600' }}>
                <Form onSubmit={handleSubmit}>
                  <FormLayout>
                    <TextField
                      value={name}
                      onChange={handleNameChange}
                      label="Name"
                      type="text"
                      autoComplete="Name"
                      placeholder='Type Your Name'
                      name="name"
                    />
                    {actionData?.errors?.name && (<InlineError message={actionData?.errors?.name} fieldID="name" />)}
                    <Select
                      label="Country"
                      options={countries.map(e => ({ label: e.name, value: e.name }))}
                      onChange={handleSelectChange}
                      value={country}
                      name="country"
                      placeholder=' Select Your Country'
                    />
                    {actionData?.errors?.country && (<InlineError message={actionData?.errors?.country} fieldID="country" />)}
                    <Select
                      label="City"
                      options={city.map(e => ({ label: e.name, value: e.name }))}
                      onChange={handleCityChange}
                      disabled={city.length ? false : true}
                      value={slectCity}
                      placeholder=' Select Your City'
                    />
                    {actionData?.errors?.city && (<InlineError message={actionData?.errors?.city} fieldID="city" />)}
                    <Select
                      label="Mazhab"
                      options={optionMazhab}
                      onChange={handleMazhabChange}
                      value={mazhab}
                      placeholder="Select Your Mazhab"
                    />
                    {actionData?.errors?.mazhab && (<InlineError message={actionData?.errors?.mazhab} fieldID="mazhab" />)}
                    <Select
                      label="Salat Method"
                      options={salatMethods?.map(e => ({ label: e.name, value: e.id.toString() }))}
                      onChange={handleSalatMethodsChange}
                      value={selectSalatMethod}
                      placeholder="Select Your City Salat Time Calculation Methods"
                    />
                    {actionData?.errors?.salat_method && (<InlineError message={actionData?.errors?.salat_method} fieldID="salat method" />)}
                    <Button submit>Submit</Button>
                  </FormLayout>
                </Form>
              </Card>
            </div>
          </BlockStack>
        </Page>
      </AppProvider>
    </>
  );
}         