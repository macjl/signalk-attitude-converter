module.exports = function(app) {
  let plugin = {};
  let unsubscribes = [];
  let attitudeCache = { pitch: null, roll: null, yaw: null, timestamp: null };

  plugin.id = 'attitude-converter';
  plugin.name = 'Attitude Converter';
  plugin.description = 'Converts between navigation.attitude (object) and individual values (pitch/roll/yaw)';

  plugin.schema = {
    type: 'object',
    required: ['direction'],
    properties: {
      direction: {
        type: 'string',
        title: 'Conversion Direction',
        enum: ['object-to-values', 'values-to-object'],
        enumNames: [
          'Object → Values (attitude → pitch/roll/yaw)',
          'Values → Object (pitch/roll/yaw → attitude)'
        ],
        default: 'object-to-values'
      },
      sourceFilter: {
        type: 'string',
        title: 'Source filter (optional)',
        description: 'Only convert values from this source. Use the full source identifier as shown in the Data Browser (e.g. "signalk-attitude-calibrator.0"). Leave empty to convert all sources.',
        default: ''
      }
    }
  };

  plugin.uiSchema = {};

  plugin.start = function(options) {
    const sourceFilter = options.sourceFilter ? options.sourceFilter.trim() : '';
    app.debug(`Attitude Converter plugin started in mode: ${options.direction}, source=${sourceFilter || '(all)'}`);

    // Declare units for the individual paths
    app.handleMessage(plugin.id, {
      updates: [{
        meta: [
          { path: 'navigation.attitude.pitch', value: { units: 'rad', description: 'Pitch angle, +bow up' } },
          { path: 'navigation.attitude.roll',  value: { units: 'rad', description: 'Roll angle, +starboard down' } },
          { path: 'navigation.attitude.yaw',   value: { units: 'rad', description: 'Yaw angle' } }
        ]
      }]
    });

    if (options.direction === 'object-to-values') {
      startObjectToValues(sourceFilter);
    } else {
      startValuesToObject(sourceFilter);
    }
  };

  // Mode: Object → Individual Values
  function startObjectToValues(sourceFilter) {
    let localSubscription = {
      context: 'vessels.self',
      subscribe: [{
        path: 'navigation.attitude'
        // No period = receive all updates immediately
      }]
    };

    app.subscriptionmanager.subscribe(
      localSubscription,
      unsubscribes,
      subscriptionError => {
        app.error('Subscription error: ' + subscriptionError);
      },
      delta => {
        delta.updates.forEach(update => {
          if (sourceFilter && update.$source !== sourceFilter) return;
          update.values.forEach(value => {
            if (value.path === 'navigation.attitude' && value.value) {
              handleAttitudeObjectUpdate(value.value, update.timestamp);
            }
          });
        });
      }
    );

    app.debug('Subscription to navigation.attitude established (object → values)');
  }

  function handleAttitudeObjectUpdate(attitudeValue, timestamp) {
    const updates = [];

    // Extract pitch
    if (typeof attitudeValue.pitch === 'number') {
      updates.push({
        path: 'navigation.attitude.pitch',
        value: attitudeValue.pitch
      });
    }

    // Extract roll
    if (typeof attitudeValue.roll === 'number') {
      updates.push({
        path: 'navigation.attitude.roll',
        value: attitudeValue.roll
      });
    }

    // Extract yaw
    if (typeof attitudeValue.yaw === 'number') {
      updates.push({
        path: 'navigation.attitude.yaw',
        value: attitudeValue.yaw
      });
    }

    // Publish deltas if we have values
    if (updates.length > 0) {
      app.handleMessage(plugin.id, {
        updates: [{
          source: {
            label: plugin.id
          },
          timestamp: timestamp || new Date().toISOString(),
          values: updates
        }]
      });

      app.debug(`Published (object→values): pitch=${attitudeValue.pitch}, roll=${attitudeValue.roll}, yaw=${attitudeValue.yaw}`);
    }
  }

  // Mode: Individual Values → Object
  function startValuesToObject(sourceFilter) {
    let localSubscription = {
      context: 'vessels.self',
      subscribe: [
        {
          path: 'navigation.attitude.pitch'
          // No period = receive all updates immediately
        },
        {
          path: 'navigation.attitude.roll'
        },
        {
          path: 'navigation.attitude.yaw'
        }
      ]
    };

    app.subscriptionmanager.subscribe(
      localSubscription,
      unsubscribes,
      subscriptionError => {
        app.error('Subscription error: ' + subscriptionError);
      },
      delta => {
        delta.updates.forEach(update => {
          if (sourceFilter && update.$source !== sourceFilter) return;
          update.values.forEach(value => {
            if (value.path === 'navigation.attitude.pitch') {
              attitudeCache.pitch = value.value;
              attitudeCache.timestamp = update.timestamp;
              publishAttitudeObject();
            } else if (value.path === 'navigation.attitude.roll') {
              attitudeCache.roll = value.value;
              attitudeCache.timestamp = update.timestamp;
              publishAttitudeObject();
            } else if (value.path === 'navigation.attitude.yaw') {
              attitudeCache.yaw = value.value;
              attitudeCache.timestamp = update.timestamp;
              publishAttitudeObject();
            }
          });
        });
      }
    );

    app.debug('Subscription to pitch/roll/yaw established (values → object)');
  }

  function publishAttitudeObject() {
    // Only publish if we have at least one valid value
    if (attitudeCache.pitch === null && 
        attitudeCache.roll === null && 
        attitudeCache.yaw === null) {
      return;
    }

    const attitudeObject = {};
    
    if (attitudeCache.pitch !== null) {
      attitudeObject.pitch = attitudeCache.pitch;
    }
    if (attitudeCache.roll !== null) {
      attitudeObject.roll = attitudeCache.roll;
    }
    if (attitudeCache.yaw !== null) {
      attitudeObject.yaw = attitudeCache.yaw;
    }

    app.handleMessage(plugin.id, {
      updates: [{
        source: {
          label: plugin.id
        },
        timestamp: attitudeCache.timestamp || new Date().toISOString(),
        values: [{
          path: 'navigation.attitude',
          value: attitudeObject
        }]
      }]
    });

    app.debug(`Published (values→object): ${JSON.stringify(attitudeObject)}`);
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f());
    unsubscribes = [];
    attitudeCache = { pitch: null, roll: null, yaw: null, timestamp: null };
    app.debug('Attitude Converter plugin stopped');
  };

  return plugin;
};
