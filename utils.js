// This closure provides various functionallities to better avoid
// code reuse and code duplication. These tools provide the ability
// to set variables, get variable values, set object values, generate
// random data. 
//
//
// Please note that you must pass in the pmInstance.
// Note that optional showDebugMessages.

getUtils = function(pmInstance, showDebugMessages) {

    let debugLog = "";

    if(!pmInstance) {
        throw Error("pm instance not passed to function.");
    }

    function log(message) {
        if(showDebugMessages) {
            debugLog += message + "\n";
        }
    }

    function getLog() {
        return debugLog;
    }

    log("------------------------------------------------------");
    log("-- utils started. logs enabled.                     --");
    log("------------------------------------------------------");

    // these defined functions provide tools in order to
    // set local variables before a request, those set variables
    // are able to be pulled into the body. And after the request
    // you are able to use these functions to get this data as well.
    // These functions are not meant to be used across requests.
    function locals() {


        // This function will set a local variable in postman.
        // The varaibleValue must not be an object. 
        // The setVaraible can then be used in the body of the
        // request.
        function set(variableName, variableValue) {
            if(typeof variableValue === "undefined" || typeof variableValue === "null") {
                log(`objectValue is null or undefined. ${variableName} not set.`);
                return;
            }
            if(typeof variableValue === "object") {
                setObject(variableName, variableValue);
                return;
            }
            log(`Setting local variable '${variableName} : '${variableValue}'.`);
            pmInstance.variables.set(variableName, variableValue);
        };

        // This function allows for setting a local object as a local
        // variable. This allows for the object's values to be used in
        // the body of the request. Note that the format is 
        // (object).(property). Ex. "{{userInfo.firstName}}"
        function setObject(objectName, objectValue) {
            if(typeof objectValue === "undefined" || typeof objectValue === "null") {
                log(`objectValue is null or undefined. ${objectName} not set.`);
                return;
            }
            log(`Setting object '${objectName}' with value ${JSON.stringify(objectValue)}`);
            let writeObjectAsJsonLocal = function(objectName, objectValue) {
                set(objectName, JSON.stringify(objectValue));
            };
            let writeObjectsPropertiesAsLocals = function(objectName, objectValue) {
                for(const propertyName in objectValue) {
                    set(`${objectName}.${propertyName}`, objectValue[propertyName]);
                }
            };
            let writeArrayProperties = function(objectName, objectValue) {
                if(Array.isArray(objectValue) === false) {
                    return;
                }
                if(objectValue.length > 0) {
                    // set a last field for arrays
                    let lastValueInArray = objectValue[objectValue.length-1];
                    set(`${objectName}.last`, lastValueInArray);
                    // set a random field for arrays
                    let randomValueInArray = random().oneOf(objectValue);
                    set(`${objectName}.random`, randomValueInArray);
                }
            }
            writeObjectAsJsonLocal(objectName, objectValue);
            writeObjectsPropertiesAsLocals(objectName, objectValue);
            writeArrayProperties(objectName, objectValue);
        };

        // THis function allows for receving a set local non-object
        // variable.
        function get(variableName) {            
            if(pmInstance.variables.has(variableName) === false) {
                return undefined;
            }
            let value = pmInstance.variables.get(variableName);
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        };

        return {
            set : set,
            get : get
        };
    }

    // This closure provides tools in order to set collection variables 
    // before and after a request. These variables cannot be used in a 
    // body. Instead these variables are to be used to across a 
    // collection.
    function collection() {

        let getDataKey = function(key) {
            return `utils.collection.${key}`;
        }

        let getLastAddedPropertyOf = function(obj) {
            return obj[Object.keys(obj)[Object.keys(obj).length - 1]];
        }
        let readData = function(key) {
            let dataKey = getDataKey(key);
            if(pmInstance.collectionVariables.has(dataKey))
            {
                try {
                    return JSON.parse(pmInstance.collectionVariables.get(dataKey));
                } catch {
                    log(`Failed to parse stored data for '${dataKey}'`);
                 }
            }
            log(`Did not find any stored data for '${dataKey}'`);
            return { };
        }
        let writeData = function(key, data) {
            let dataKey = getDataKey(key);
            log(`writing data to collection: ${dataKey} : ${JSON.stringify(data)}`);
            pmInstance.collectionVariables.set(dataKey, JSON.stringify(data));
        }

        let writeValue = function(key, value) {
            if(typeof value === "object") {
                log(`cannot write '${key}' as it is an object value. (${JSON.stringify(value)})'`);
                return;
            }
            log(`writing value to collection: ${key} : ${value}`);
            pmInstance.collectionVariables.set(key, value);
        }

        // This function will return either getMostRecent 
        // or getSpecific
        // based on the number of variables passed into it. 
        // If only the key, it will return the result 
        // of getMostRecent(key)
        // If the varaibleName & the endpointName, it will return
        // the result of getSpecific(key, endpoint)
        function get(key, endpoint) {
            if(!key)
            {
                throw Error("key must be passed into utils.collection.get");
            }
            if(endpoint) {
                return getSpecific(key, endpoint);
            } else {
                return getMostRecent(key);
            }
        }

        // This function will return the most recently set variable
        // based on the key.
        let getMostRecent = function(key) {
            let data = readData(key);
            return getLastAddedPropertyOf(data);
        }

        // This function will return a specific set variable based 
        // both on the key and the endpoint specified.
        let getSpecific = function(key, endpoint) {
            let data = readData(key);
            if(endpoint in data === false) {
                log(`endpoint '${endpoint}' not found for key '${key}'`)
                return undefined;
            }
            return data[endpoint];
        }

        // This function will set a varaible with the specified key
        // and with the specified value.
        function set(key, value) {
            let endpoint = request().getEndpoint();
            let data = readData(key);
            if(endpoint in data) {
                log(`endpoint '${endpoint}' already had previous value. overwriting.'`);
                delete data[endpoint];
            }
            data[endpoint] = value;
            writeData(key, data);
            writeValue(key, value);
        }

        // This function allows for adding additional values of an stored
        // array variable. If the array has not been created yet, it will
        // start the array first.
        function push(key, value) {
            let data = get(key);
            if(!data) {
                data = [];
            }
            data.push(value);
            set(key, data);
        }

        // this function removes all stored variables of the specified
        // key. 
        function remove(key) {
            let dataKey = getDataKey(key);
            pm.collectionVariables.unset(dataKey);
        }

        // this function determines if the variable is set. 
        function has(key, endpoint) {
            if(!get(key, endpoint)) {
                return false;
            }
            return true;
        }

        return {
            get : get,
            set: set,
            push: push,
            remove: remove,
            has: has
        };
    }

    // This is deprecated, once all references to it are removed, this should be removed. 
    function helpers() {

        return { 
            isSuccess : response().isSuccess, // deprecated
            isFailure : response().isFailure, // deprecated
            getEndpointTail : request().getUriTail //deprecated
        };
    }

    // This clsure provides miscallenous functionallity dealing with random
    // values. 
    function random() {

        function getDynamic(variableName) { 
            return pmInstance.variables.replaceIn(`{{$${variableName}}}`);
        }

        // This function takes in an array and returns a single random
        // element within that array. 
        function oneOf(arrayObject) {
            if(Array.isArray(arrayObject) === false) {
                throw Error("Cannot pass non-array object into one Of");
            }
            let randomIndex = Math.floor(Math.random()*arrayObject.length);
            return arrayObject[randomIndex];
        }

        function generateFirstName() {
            return stripQuotes(getDynamic("randomFirstName"));
        }

        function generateLastName() {
            return stripQuotes(getDynamic("randomLastName"));
        }

        function generateFullName(firstName, lastName) {
            if(!firstName || !lastName) {
                firstName = generateFirstName();
                lastName = generateLastName();
            }
            return `${firstName} ${lastName}`;
        }

        function generateNumberByDigits(digits) {
            let min = Math.pow(10, digits-1);
            let value = 9 * Math.pow(10, digits-1);
            return Math.floor(min + Math.random() * value);
        }

        function stripQuotes(str) { 
            return str.replace(/['"]+/g, '');
        }

        function generateBirthDate() {
            const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            const zeroPad = (num, places) => String(num).padStart(places, '0')
            var date = randomDate(new Date(2000, 0, 1), new Date());
            var year_last_integer = generateNumberByDigits(1);
            return '199' + year_last_integer + '-' + zeroPad((date.getMonth() + 1),2) + '-' + zeroPad(date.getDate(),2);
        }

        function generateTin() {
            return generateNumberByDigits(9);
        }

        function generatePhoneNumber() {
            return `+1610${generateNumberByDigits(7)}`;
        }

        function generateEmail(firstName, lastName) {
            return `${firstName ? firstName : generateFirstName()}.${lastName ? lastName : generateLastName()}@yopmail.com`;
        }

        function identities() { 
            function generateIdentity() {
                let firstName = generateFirstName();
                let lastName = generateLastName();
                let fullName = generateFullName(firstName, lastName);
                let birthDate = generateBirthDate();
                let tin = generateTin();
                let email = generateEmail(firstName, lastName);
                let phoneNumber = generatePhoneNumber();

                return { 
                    firstName: firstName, 
                    lastName: lastName, 
                    fullName: fullName,
                    birthDate: birthDate,
                    tin: tin,
                    email: email,
                    phoneNumber: phoneNumber
                };
            }

            // This function generates a random set of user information.
            function generateUserInfo() {
                let identity = generateIdentity();
                return { 
                    firstName: identity.firstName, 
                    lastName: identity.lastName, 
                    fullName: identity.fullName,
                    birthDate: identity.birthDate,
                    tin: identity.tin,
                    email: identity.email,
                    userName: identity.email,
                    phoneNumber: identity.phoneNumber
                };
            }

            function generateOrgInfo() {
                let identity = generateIdentity();
                let name = `${identity.lastName} Inc`;
                return {
                    name: name,
                    tin: identity.tin,
                    email: identity.email,
                    phoneNumber: identity.phoneNumber
                };

            }

            function generateLinkedAccount() { 
                let accountNumber = generateNumberByDigits(9);
                let accountTitle = `${getDynamic("randomJobTitle")} Services`;
                return {
                    accountNumber : accountNumber,
                    accountTitle : accountTitle
                };
            }

            return {
                generateIdentity : generateIdentity,
                generateUserInfo : generateUserInfo,
                generateOrgInfo : generateOrgInfo,
                generateLinkedAccount : generateLinkedAccount
            };
        }

        return {
            oneOf : oneOf,
            identities : identities(),
            generateBirthDate: generateBirthDate,
            generateFirstName: generateFirstName,
            generateLastName: generateLastName,
            generateFullName: generateFullName,
            generateEmail: generateEmail,
            generateTin: generateTin,
            generatePhoneNumber: generatePhoneNumber
        };
    }

    function response() {

        function onSuccess(func) {
            if(isSuccess()) {
                func();
            }
        }

        function isSuccess() {
            return pmInstance.response.code.toString()[0] === "2";
        }

        function isFailure() {
            return isSuccess() === false;
        }

        function get() {
            if(isFailure()) {
                throw new Error("Cannot get response if failed.");
            }
            return pmInstance.response.json();
        }

        let addFieldsToResponse = function(response, fields) {
            let output = response;
            for(const propertyName in fields) {
                let propertyValue = fields[propertyName];
                output[propertyName] = propertyValue;
            }
            return output;
        }

        function set({responseType, addFields}) {
            if(isFailure()) {
                return;
            }
            let response = get();
            if(addFields) {
                response = addFieldsToResponse(response, addFields);
            }
            collection().set(responseType, response);
        }

        function push({responseType, addFields}) {
            if(isFailure()) {
                return;
            }
            let response = get();
            if(addFields) {
                response = addFieldsToResponse(response, addFields);
            }
            collection().push(responseType, response);
        }

        return {
            get: get,
            set: set,
            push: push,
            isSuccess: isSuccess,
            isFailure: isFailure,
            onSuccess: onSuccess
        };
    }

    function request() {
        // taken from https://stackoverflow.com/questions/67493034/how-to-add-comments-in-postman-json-body-for-collection-level-pre-request-scrip/67493035#67493035
        let stripCommentsFromJson = function(rawData) {
            const strippedData = rawData.replace(
                /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
                (m, g) => g ? "" : m
            );
            return strippedData;
        }

        function get(){
            let requestBody = pmInstance.request.body.toString();
            return JSON.parse(stripCommentsFromJson(requestBody));
        }

        function getUriTail() {
            let urlPath = pmInstance.request.url.path;
            let endPointIndex = urlPath.indexOf(pmInstance.info.requestName);
            return urlPath[endPointIndex+1];
        }

        function getEndpoint() {
            let urlPath = pmInstance.request.url.path;
            let endPointIndex = urlPath.indexOf(pmInstance.info.requestName);
            return `${urlPath[endPointIndex-1]}/${urlPath[endPointIndex]}`;
        }

        return {
            get: get,
            getUriTail: getUriTail,
            getEndpoint: getEndpoint
        };
    }

    function collectionToLocal() {
        function pass(key, value) {
            if(collection().has(key, value)) {
                locals().set(key, collection().get(key, value));
            }
        }

        return {
            pass: pass
        };
    }

    

    return {
        locals : locals(),
        collection : collection(),
        helpers : helpers(),
        random : random(),
        response: response(),
        request: request(),
        collectionToLocal: collectionToLocal(),
        getLog
    };
};
