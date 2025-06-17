import { ApiManager } from './ApiManager';
import { ApiManagerMock } from './ApiManagerMock';

// Use ApiManagerMock here for local testing/developing
export const API = new ApiManager();
window.aa_debug = API;
