const ECS_API_URL =
  "http://tablue-tablu-r8ty2qntrtky-1570365544.us-east-1.elb.amazonaws.com/flask/filter-data";

export async function fetchFilterData() {
  try {
    const response = await fetch(ECS_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Data received:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export async function postFilterData(data) {
  try {
    const response = await fetch(ECS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Data successfully posted:", responseData);
  } catch (error) {
    console.error("Error posting data:", error);
  }
}
