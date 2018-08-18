/*
 * File: c:\enail-magic\src\ble\emData.ts
 * Project: c:\enail-magic
 * Created Date: Friday August 17th 2018
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
interface IEMData {
    readonly temperature: number;
    readonly status: number;
    readonly profileIndex: number;
    readonly stepIndex: number;
}