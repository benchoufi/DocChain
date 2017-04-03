# DocChain
Blockchain tool for getting informed consent

<!-- here's how the app structure goes -->

## the client folder
this contains in the website front-end. The framework in use is Angular.

the main services logic are set in the services folder such as `file upload`, `email signing`,…

the concrete implementations of these services are set in the controllers folder

## the agent folder

This consiste in the API handling the bitcoin interaction, exposed through URL such as ```https://docchain.stratumn.net/some/path/to/some/services```

You’ll find these API calls in the Angular App through consistent calls to a ```AgentFunctionURL``` variable. Depending on the API call, this url is adjusted.

