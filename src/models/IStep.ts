/*
 * File: c:\enail-magic\src\models\IStep.ts
 * Project: c:\enail-magic
 * Created Date: Saturday August 25th 2018
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
export interface IStep {
    readonly key?: number;
    readonly message?: string;
    readonly type: string;
    readonly sounds?: { start?: string, end?: string };
    readonly delays?: { start?: number, end?: number, timeout?: number };
}
