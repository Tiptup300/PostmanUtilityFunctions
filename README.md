# Postman Utility Functions

This repository contains a set of utility functions designed to enhance the functionality and ease of use within Postman. These utilities provide various functionalities such as setting and getting variables, generating random data, handling responses, and more.

## Features

- **Local Variable Management**: Set and get local variables within Postman requests.
- **Collection Variable Management**: Set and get collection variables to be used across multiple requests.
- **Random Data Generation**: Generate random names, dates, TINs, phone numbers, and email addresses.
- **Response Handling**: Convenient methods to handle and manipulate API responses.
- **Debug Logging**: Enable debug logging to track the flow and state of your scripts.

## Installation

To use these utility functions in your Postman collection:

1. Copy the `getUtils` function from the `utils.js` file in this repository.
2. Paste the function into your Postman Pre-request Script or Tests tab.
3. Initialize the utility functions by calling `getUtils(pm, true)` where `pm` is the Postman instance and `true` enables debug logging.

## Usage

### Initialize Utilities

```javascript
const utils = getUtils(pm, true); // Enable debug logging
// or
const utils = getUtils(pm, false); // Disable debug logging
```

### Set and Get Local Variables

```javascript
utils.locals.set("variableName", "variableValue");
const value = utils.locals.get("variableName");
```

### Set and Get Collection Variables

```javascript
utils.collection.set("key", "value");
const value = utils.collection.get("key");
```

### Generate Random Data

```javascript
const firstName = utils.random.generateFirstName();
const lastName = utils.random.generateLastName();
const email = utils.random.generateEmail(firstName, lastName);
```

### Handle Responses

```javascript
utils.response.onSuccess(() => {
    console.log("Request was successful!");
});

if (utils.response.isSuccess()) {
    const responseData = utils.response.get();
    console.log(responseData);
}
```

### Debug Logging

```javascript
const log = utils.getLog();
console.log(log);
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any suggestions or improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
