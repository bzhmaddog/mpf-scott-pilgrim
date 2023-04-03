import { PubSub } from "./utils/PubSub.js"

// Extend window object 
declare global {
    interface Window {
        DMDDisplay : any;
    }
}