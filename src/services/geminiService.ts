const translationCache: Record<string, string> = {};

export const translateLocation = async (location: string): Promise<string> => {
  if (translationCache[location]) return translationCache[location];

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    translationCache[location] = data.translated;
    return data.translated;
  } catch (error) {
    console.error("Gemini translation error:", error);
    return location;
  }
};

const detailsCache: Record<string, string> = {};

export const getLocationDetails = async (location: string): Promise<string> => {
  if (!location) return '';
  if (detailsCache[location]) return detailsCache[location];

  try {
    const response = await fetch("/api/location-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    detailsCache[location] = data.details || "";
    return data.details || "";
  } catch (error) {
    console.error("Gemini details error:", error);
    return "";
  }
};
