/******************************************************************************
 *
 *  Filename    : decoder.js
 *  Author      : Joe Deu-Ngoc
 *  Date        : 2020/09/03
 *  Description : TTN Decoder Script
 *
 ******************************************************************************
 *
 *  JTD Consulting ("JTDC") Confidential
 *  Copyright (c) 2018-2021 JTD Consulting, All Rights Reserved.
 *
 *  NOTICE:  All information contained herein is, and remains the property
 *  of JTDC.  The intellectual and technical concepts contained herein
 *  are proprietary to and may be covered by International patents, patents
 *  in process, and are protected by trade secret or copyright law.
 *
 *  Dissemination of this information or reproduction of this material is
 *  strictly forbidden unless prior written permission is obtained from
 *  JTDC.  Access to the source code contained herein is
 *  hereby forbidden to anyone except current JTDC employees, managers,
 *  contractors, or affiliates who have executed Confidentiality and
 *  Non-disclosure agreements explicitly covering such access.
 *
 *  The copyright notice above does not evidence any actual or intended
 *  publication or disclosure of this source code, which includes
 *  information that is confidential and/or proprietary, and is a trade
 *  secret, of JTDC.
 *
 *  ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC PERFORMANCE, OR
 *  PUBLIC DISPLAY OF OR THROUGH USE OF THIS SOURCE CODE  WITHOUT THE
 *  EXPRESS WRITTEN CONSENT OF JTDC IS STRICTLY PROHIBITED, AND IN
 *  VIOLATION OF APPLICABLE LAWS AND INTERNATIONAL TREATIES.  THE RECEIPT OR
 *  POSSESSION OF THIS SOURCE CODE AND/OR RELATED INFORMATION DOES NOT
 *  CONVEY OR IMPLY ANY RIGHTS  TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS
 *  CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT  MAY
 *  DESCRIBE, IN WHOLE OR IN PART.
 *
 ******************************************************************************/
function Decoder(bytes, port) {
  var decoded = {};
  
  if(bytes[0] & 0x70)
  {
    decoded.status = 1;
    if(bytes[0] & 0x40)
    {
      decoded.trigger = "accelerometer";
    }
    else if(bytes[0] & 0x20)
    {
      decoded.trigger = "button";
    }
    else if((bytes[0] & 0x60) === 0)
    {
      decoded.trigger = "periodic";
    }
  
    // GPS information
    if(bytes[0] & 0x10)
    {
      var lat_deg = ((bytes[1] >> 4) & 0xF) * 10 + (bytes[1] & 0xF);
      var lat_min = ((bytes[2] >> 4) & 0xF) * 10 + (bytes[2] & 0xF);
      var lat_frac = ((bytes[3] >> 4) & 0xF) * 100 + (bytes[3] & 0x0F) * 10 + ((bytes[4] >> 4) & 0xF);
      var lat_sec = lat_frac * 60 / 1000.0;
      
      var lat_dir = (bytes[4] & 0x1) ? "S" : "N";
      var lng_deg = ((bytes[5] >> 4) & 0xF) * 100 + (bytes[5] & 0xF) * 10 + ((bytes[6] >> 4) & 0x0F);
      var lng_min = (bytes[6] & 0xF) * 10 + ((bytes[7] >> 4) & 0xF);
      var lng_frac = (bytes[7] & 0xF) * 100 + ((bytes[8] >> 4) & 0x0F) * 10;
      var lng_sec = lng_frac * 60 / 1000.0;
      var lng_dir = (bytes[8] & 0x1) ? "W" : "E";

      decoded.latitude = lat_deg.toString() + "°" + lat_min.toString() + "'" + lat_sec.toString() + lat_dir;
      decoded.longitude = lng_deg.toString() + "°" + lng_min.toString() + "'" + lng_sec.toString() + lng_dir;
      
      // Non-legacy mode
      if(bytes.length > 9)
      {
        switch((bytes[9] >> 4) & 0xF)
        {
          case 1:
            decoded.rx_scale = "Good";
            break;
          case 2:
            decoded.rx_scale = "Average";
            break;
          case 3:
            decoded.rx_scale = "Poor";
            break;
          default:
            decoded.rx_scale = "Invalid";
            break;
        }

        decoded.num_satellites = (bytes[9] & 0xF) + 1;
      }
    }
  }
  else if(bytes[0] & 0x8F)
  {
    decoded.status = 2;
    
    // Temperature information
    if(bytes[0] & 0x80)
    {
      var test = bytes[1];
     
      if(test < 128)
      {
        decoded.temperature = test;
      }
      else
      {
        decoded.temperature = test - 256;
      }
    }
    
    // Uplink frame counter
    if(bytes[0] & 0x08)
    {
      decoded.ul_counter = bytes[2];
    }
    
    // Downlink frame counter
    if(bytes[0] & 0x04)
    {
      decoded.dl_counter = bytes[3]
    }
    
    // Battery level information
    if(bytes[0] & 0x02)
    {
      decoded.battery_mV = ((bytes[4] << 8) + bytes[5]) / 1000.0;
    }
    
    // RSSI and SNR information
    if(bytes[0] & 0x01)
    {
      decoded.rssi = -bytes[6];
      if(bytes[7] < 128)
      {
        decoded.snr = bytes[7];
      }
      else
      {
        decoded.snr = bytes[7] - 256;
      }
    }
  }
  else
  {
    decoded.status = 0;
  }

  return decoded;
}
