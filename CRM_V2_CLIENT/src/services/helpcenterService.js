import api from "./api";

export const createTicket = async (payload) => {
  try {
    const response = await api.post("/tickets", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Unable to create ticket"
    );
  }
};


export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = () => {
      const base64 = reader.result.split(",")[1]
      resolve(base64)
    }

    reader.onerror = (error) => reject(error)
  })
