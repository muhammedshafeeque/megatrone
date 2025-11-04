import { terminal } from '../../terminal.js';
export const whatWeb = async (url) => {
    const response = await terminal(`whatweb ${url} --color=never`);
    return response;
}