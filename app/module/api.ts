interface UserData  {
    name: string,
    country: string,
    city?: string,
    mazhab: string,
    salat_method: string,
}

const baseUrl: string = "https://api.aladhan.com/v1";

function getPrayerTimeApiUrl(userData: UserData): string {
    const salatTime: Date    = new Date();
    const currentYear: number  = salatTime.getFullYear();
    const currentMonth: number = salatTime.getMonth() + 1;
    const searchParams = new URLSearchParams({
        method: userData.salat_method,
        school: userData.mazhab
    });

    if (userData.city) {
        searchParams.set("city", userData.city);
        searchParams.set("country", userData.country);
    } else {
        searchParams.set("address", userData.country);
    }

    return `${baseUrl}/calendarByCity/${currentYear}/${currentMonth}?${searchParams.toString()}`;
}

export async function getPrayerTimeData(userData: UserData) {
    return fetch(getPrayerTimeApiUrl(userData))
          .then((response) => {
            if (!response.ok) throw new Error('status code  400') 
            return response.json();
          });
}
export async function getPrayerTimeCalculationMethods() {
    const url: string = `${baseUrl}/methods`;
    return fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error('status code 400');
             return response.json();
        });
}