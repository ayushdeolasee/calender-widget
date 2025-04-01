# calender-widget


Code: 
-- datetime.datetime $current: $datetime.now()
-- ftd.integer: $current.dt

-- datetime.datetime $start: $datetime.now()
-- ftd.integer: $start.dt

-- datetime.datetime $end: $datetime.now()
-- ftd.integer: $end.dt

-- calender-widget:
dt: $current

-- web-component calender-widget:
datetime.datetime dt:
js: $assets.files.js.components.js

-- end: calender-widget

-- date-input:
dt: $current

-- web-component date-input:
datetime.datetime dt:
js: $assets.files.js.components.js

-- end: date-input

-- time-input:
dt: $current

-- web-component time-input:
datetime.datetime dt:
js: $assets.files.js.components.js

-- end: time-input

-- calender-range:
start_dt: $start
end_dt: $end

-- web-component calender-range:
datetime.datetime start_dt:
datetime.datetime end_dt:
js: $assets.files.js.components.js

-- end: calender-range

-- date-range:
start_dt: $start
end_dt: $end

-- web-component date-range:
datetime.datetime start_dt:
datetime.datetime end_dt:
js: $assets.files.js.components.js

-- end: date-range

-- time-range:
start_dt: $start
end_dt: $end

-- web-component time-range:
datetime.datetime start_dt:
datetime.datetime end_dt:
js: $assets.files.js.components.js

-- end: time-range