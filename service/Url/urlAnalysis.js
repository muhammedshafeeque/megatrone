export const whatWeb = async (url) => {
    const response = await axios.get(`https://api.whatweb.net/api/v2/whatweb/${url}`);
    return response.data;
}