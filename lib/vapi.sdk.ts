import Vapi from "@vapi-ai/web";

// Initialize Vapi with your token
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

export default vapi;
