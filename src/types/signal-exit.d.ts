/*
 * File: c:\enail-magic\src\types\signal-exit.d.ts
 * Project: c:\enail-magic
 * Created Date: Friday August 24th 2018
 * Author: J-Cat
 * -----
 * Last Modified:
 * Modified By:
 * -----
 * License: 
 *    This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 
 *    International License (http://creativecommons.org/licenses/by-nc/4.0/).
 * -----
 * Copyright (c) 2018
 */
declare module 'signal-exit' {
    const onExit: (callback: (code: number, signal: string) => void) => void;

    export = onExit;
}