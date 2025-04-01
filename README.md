# Calender Widget

A versatile calendar widget for the FASTN language. 

## Overview

This package offers calendar functionality for FASTN applications. Visit [calender-widget.fifthtry.site](https://calender-widget.fifthtry.site) for detailed documentation and examples.



## Installation

Add the following to your `FASTN.ftd` file:

```ftd
-- fastn.dependency: datetime-v0.fifthtry.site
-- fastn.dependency: calender-widget.fifthtry.site
-- fastn.auto-import: datetime-v0.fifthtry.site as datetime
-- fastn.auto-import: calender-widget.fifthtry.site as calender
```

## Quick Start

Here's a simple example of how to use the calendar widget:

```ftd
-- datetime.datetime $dt: $datetime.now()
-- calender:
   dt: $dt
```

## Documentation

For complete documentation, examples, and API reference, visit our [documentation site](https://calender-widget.fifthtry.site).

## License

AGPL-3
