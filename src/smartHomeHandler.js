const DeyeCloudClient = require('./deyeClient');

class GoogleSmartHomeHandler {
  constructor(deyeClient) {
    this.deyeClient = deyeClient;
  }

  /**
   * Map Deye device to Google Smart Home device
   */
  mapDeyeDeviceToGoogle(deyeDevice) {
    // Determine device type based on Deye device properties
    // Default to LIGHT as a generic controllable device
    let deviceType = 'action.devices.types.LIGHT';
    let traits = ['action.devices.traits.OnOff'];

    // Map device based on productType or deviceType if available
    if (deyeDevice.productType) {
      const productType = deyeDevice.productType.toLowerCase();
      if (productType.includes('inverter') || productType.includes('battery')) {
        deviceType = 'action.devices.types.SWITCH';
        traits = ['action.devices.traits.OnOff'];
      }
    }

    return {
      id: deyeDevice.deviceSn || deyeDevice.sn,
      type: deviceType,
      traits: traits,
      name: {
        defaultNames: [deyeDevice.deviceName || 'Deye Device'],
        name: deyeDevice.deviceName || deyeDevice.name || 'Deye Device',
        nicknames: [deyeDevice.deviceName || deyeDevice.name || 'Deye Device']
      },
      willReportState: true,
      deviceInfo: {
        manufacturer: 'Deye',
        model: deyeDevice.productType || 'Unknown',
        hwVersion: '1.0',
        swVersion: '1.0'
      }
    };
  }

  /**
   * Handle SYNC intent - return list of devices
   */
  async handleSync(request) {
    try {
      console.log('Handling SYNC intent');
      
      // Get all devices from Deye Cloud
      const devicesData = await this.deyeClient.getDeviceList();
      
      // Extract devices array - handle different response structures
      let devices = [];
      if (Array.isArray(devicesData)) {
        devices = devicesData;
      } else if (devicesData.list && Array.isArray(devicesData.list)) {
        devices = devicesData.list;
      } else if (devicesData.devices && Array.isArray(devicesData.devices)) {
        devices = devicesData.devices;
      }

      console.log(`Found ${devices.length} devices`);

      // Map Deye devices to Google Smart Home format
      const googleDevices = devices.map(device => this.mapDeyeDeviceToGoogle(device));

      return {
        requestId: request.requestId,
        payload: {
          agentUserId: request.inputs[0].payload.agentUserId || 'deye-user',
          devices: googleDevices
        }
      };
    } catch (error) {
      console.error('Error handling SYNC:', error);
      return {
        requestId: request.requestId,
        payload: {
          errorCode: 'hardError',
          debugString: error.message
        }
      };
    }
  }

  /**
   * Handle QUERY intent - return device states
   */
  async handleQuery(request) {
    try {
      console.log('Handling QUERY intent');
      
      const deviceIds = request.inputs[0].payload.devices.map(device => device.id);
      console.log(`Querying devices: ${deviceIds.join(', ')}`);

      // Get device status from Deye Cloud
      const devicesStatus = await this.deyeClient.getDeviceStatus(deviceIds);

      // Build device states response
      const deviceStates = {};
      
      for (const deviceId of deviceIds) {
        // Find status for this device
        const deviceStatus = devicesStatus.find(d => 
          d.deviceSn === deviceId || d.sn === deviceId
        );

        if (deviceStatus) {
          // Map device status to Google format
          // Default state - assume online and on if we have status data
          deviceStates[deviceId] = {
            online: true,
            on: true,
            status: 'SUCCESS'
          };

          // Add additional state based on device data if available
          if (deviceStatus.data) {
            // Check if device appears to be off/inactive
            if (deviceStatus.data.status === 'offline' || 
                deviceStatus.data.status === 0 ||
                deviceStatus.data.power === 0) {
              deviceStates[deviceId].on = false;
            }
          }
        } else {
          // Device not found or no status
          deviceStates[deviceId] = {
            online: false,
            status: 'ERROR',
            errorCode: 'deviceNotFound'
          };
        }
      }

      return {
        requestId: request.requestId,
        payload: {
          devices: deviceStates
        }
      };
    } catch (error) {
      console.error('Error handling QUERY:', error);
      return {
        requestId: request.requestId,
        payload: {
          errorCode: 'hardError',
          debugString: error.message
        }
      };
    }
  }

  /**
   * Handle EXECUTE intent - execute device commands
   */
  async handleExecute(request) {
    try {
      console.log('Handling EXECUTE intent');
      
      const commands = request.inputs[0].payload.commands;
      const commandResults = [];

      for (const command of commands) {
        const deviceIds = command.devices.map(device => device.id);
        
        for (const execution of command.execution) {
          console.log(`Executing command: ${execution.command} on devices: ${deviceIds.join(', ')}`);
          
          // Handle OnOff command
          if (execution.command === 'action.devices.commands.OnOff') {
            const turnOn = execution.params.on;
            
            for (const deviceId of deviceIds) {
              try {
                // Set work mode based on on/off state
                // Mode 0 = off, Mode 1 = on (example values, may need adjustment)
                await this.deyeClient.setWorkMode(deviceId, turnOn ? 1 : 0);
                
                commandResults.push({
                  ids: [deviceId],
                  status: 'SUCCESS',
                  states: {
                    online: true,
                    on: turnOn
                  }
                });
              } catch (error) {
                console.error(`Error executing command on device ${deviceId}:`, error);
                commandResults.push({
                  ids: [deviceId],
                  status: 'ERROR',
                  errorCode: 'hardError'
                });
              }
            }
          } else {
            // Unsupported command
            commandResults.push({
              ids: deviceIds,
              status: 'ERROR',
              errorCode: 'functionNotSupported'
            });
          }
        }
      }

      return {
        requestId: request.requestId,
        payload: {
          commands: commandResults
        }
      };
    } catch (error) {
      console.error('Error handling EXECUTE:', error);
      return {
        requestId: request.requestId,
        payload: {
          errorCode: 'hardError',
          debugString: error.message
        }
      };
    }
  }

  /**
   * Handle DISCONNECT intent - user unlinked account
   */
  async handleDisconnect(request) {
    console.log('Handling DISCONNECT intent');
    
    return {
      requestId: request.requestId,
      payload: {}
    };
  }

  /**
   * Main handler for all intents
   */
  async handleRequest(request) {
    console.log('Received request:', JSON.stringify(request, null, 2));
    
    const intent = request.inputs[0].intent;
    
    switch (intent) {
      case 'action.devices.SYNC':
        return await this.handleSync(request);
      
      case 'action.devices.QUERY':
        return await this.handleQuery(request);
      
      case 'action.devices.EXECUTE':
        return await this.handleExecute(request);
      
      case 'action.devices.DISCONNECT':
        return await this.handleDisconnect(request);
      
      default:
        console.error('Unknown intent:', intent);
        return {
          requestId: request.requestId,
          payload: {
            errorCode: 'functionNotSupported'
          }
        };
    }
  }
}

module.exports = GoogleSmartHomeHandler;
