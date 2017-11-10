const   errors = require('./espresso.errors'),
        EspressoServerInvalidFormatError = errors.EspressoServerInvalidFormatError;
/**
 * Class called by EspressoBodyParser to parse XML.
 * 
 * @class EspressoServerBodyParserXML
 */
module.exports.EspressoServerBodyParserXML = class EspressoServerBodyParserXML {};

/**
 * Class called by EspressoBodyParser to parse JSON.
 * 
 * @class EspressoServerBodyParserJSON
 */
module.exports.EspressoServerBodyParserJSON = class EspressoServerBodyParserJSON { 
    
    /**
     * Parses the content.
     * 
     * @param {any} body_content 
     * @memberof EspressoServerBodyParserJSON
     */
    parseContent(body_content) { 
        try {
            this.body_content = JSON.parse(body_content);
        } catch(error) {
                throw new EspressoServerInvalidFormatError();
        }
    }

    /**
     * Creates an instance of EspressoServerBodyParserJSON.
     * @param {any} body_content 
     * @memberof EspressoServerBodyParserJSON
     */
    constructor(body_content) { 
        this.body_content = {};
        this.body_content_type = "application/json";
        this.parseContent(body_content);
    }
};