# Records
## datetime
The datetime record contains two values, timezone_offset and dt which stores the value the datetime.

## datetime-ex
Stores the components of the datetime object. These values include:
- integer dt
- integer timezone_offset
- integer year
- integer month
- integer day
- integer hour
- integer minute
- integer second
- integer millisecond

# datetime-delta
Store only one integer value, delta which holds the delta value return from the delta function. 

# Functions
## datetime-fn
### Params:
- integer diff - value in minutes to offset the datetime object

Returns two integers, dt and timezone_offset. dt stores the datetime value in i64 format and timezone_offset stores the timezone_offset.

## delta
### Params:
- optional datetime start
- datetime end 

Returns an integer value that calculates the delta between the datetime objects. If a start value is provided the delta is calculcated between start and end time. If start isn't provided then the delta between current time and end time is calculated. 

## parts
### Params:
- datetime dt

This functions breaks down dt and returns a datetime-ex record.


# Example Code
```
-- datetime current: $datetime-fn()
-- ftd.integer: $current.dt
-- ftd.integer: $current.timezone_offset

-- datetime later: $datetime-fn(diff = 30)
-- ftd.integer: $later.dt

-- datetime-ex parts-datetime: $parts(dt = $current)
-- ftd.integer: $parts-datetime.year

-- datetime-delta delta-number: $delta(start = $current, end = $later)
-- ftd.integer: $delta-number.delta
```