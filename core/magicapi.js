import { encode, decode } from './utils.js';
import * as settings from './settings.js';

const MAGICAPI_KEY_NAME = 'magicApiKey';
const HARDCODED_API_KEY = 'Y21kdjYyZHl5MDAwMWxqMDQ1N2ZhZXRzMA==';

export function getMagicApiKey() {
    const encodedKey = localStorage.getItem(MAGICAPI_KEY_NAME);
    if (encodedKey) {
        return decode(encodedKey);
    }
    return decode(HARDCODED_API_KEY);
}

export async function uploadFile(file) {
    const apiKey = getMagicApiKey();
    if (!apiKey) {
        throw new Error("MagicAPI key is not set and no default key is available.");
    }
    const formData = new FormData();
    formData.append('filename', file);

    const response = await fetch(
        'https://prod.api.market/api/v1/magicapi/image-upload/upload',
        {
            method: 'POST',
            headers: { 'x-magicapi-key': apiKey },
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`MagicAPI upload failed: ${response.status} - ${errorData.message}`);
    }

    const { url } = await response.json();
    return url;
}