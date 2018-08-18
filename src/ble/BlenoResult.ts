/*
 * File: c:\enail-magic\src\ble\BlenoResult.ts
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
export enum BlenoResult {
    RESULT_SUCCESS = 0x00,
    RESULT_INVALID_OFFSET = 0x07,
    RESULT_ATTR_NOT_LONG = 0x0b,
    RESULT_INVALID_ATTRIBUTE_LENGTH = 0x0d,
    RESULT_UNLIKELY_ERROR = 0x0e
}