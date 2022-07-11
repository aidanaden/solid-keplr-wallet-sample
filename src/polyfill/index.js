import { Buffer } from "buffer";
import process from "./process-es6";

window.global = window;
window.global.Buffer = Buffer;
window.process = process;
