
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherInfo {
  temp: string;
  condition: string;
  icon: string;
  high: string;
  low: string;
  isLive: boolean;
  location: string;
}

export const fetchWeather = async (city: 'Seoul' | 'Busan', dateStr: string): Promise<WeatherInfo | null> => {
  if (!API_KEY) {
    console.warn('OpenWeather API Key is missing. Using fallback data.');
    return null;
  }

  try {
    const targetDate = new Date(`2026-${dateStr.replace('/', '-')}`);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays > 5) {
      return null;
    }

    const lat = city === 'Seoul' ? 37.5665 : 35.1796;
    const lon = city === 'Seoul' ? 126.9780 : 129.0756;

    const response = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`);
    const data = await response.json();

    if (data.cod !== '200') {
      throw new Error(data.message);
    }

    const targetDateString = targetDate.toISOString().split('T')[0];
    const dayForecasts = data.list.filter((item: any) => item.dt_txt.includes(targetDateString));
    
    if (dayForecasts.length === 0) return null;

    const noonForecast = dayForecasts.find((item: any) => item.dt_txt.includes('12:00:00')) || dayForecasts[0];
    
    const temps = dayForecasts.map((f: any) => f.main.temp);
    const high = Math.max(...temps);
    const low = Math.min(...temps);

    return {
      temp: `${Math.round(noonForecast.main.temp)}°`,
      condition: noonForecast.weather[0].description,
      icon: noonForecast.weather[0].icon,
      high: `H:${Math.round(high)}°`,
      low: `L:${Math.round(low)}°`,
      isLive: true,
      location: city === 'Seoul' ? '首爾' : '釜山'
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};
