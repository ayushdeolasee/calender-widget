# Datetime Package 

A comprehensive datetime package for the FASTN language that provides utilities for date and time manipulation, formatting, and parsing.

## Overview

This package offers datetime functionality for FASTN applications. Visit [datetime-v0.fifthtry.site](https://datetime-v0.fifthtry.site) for detailed documentation and examples.

## Features

- Get current date time
- format datetime to required format

## Installation

Add the following to your `FASTN.ftd` file:

```ftd
-- fastn.dependency: datetime-v0.fifthtry.site
```

## Quick Start

Here's a simple example of how to use the datetime package:

```ftd
-- datetime current: $now()
-- string format-string: $fmt(dt = $current, ft = "datetime")
-- ftd.text: $format-string
```

## Documentation

For complete documentation, examples, and API reference, visit our [documentation site](https://datetime-v0.fifthtry.site).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

AGPL-3

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.