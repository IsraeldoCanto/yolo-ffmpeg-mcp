let app

function startApp(tokenId) {
    var storedData = localStorage.getItem('kompost-model');
    var flags = storedData ? JSON.parse(storedData) : null;
    console.log("Starting Kompost application")
    app = Elm.Main.init({
        node: document.getElementById("kompost"),
        flags: tokenId
    });
    // Listen for commands from the `setStorage` port.
    // Turn the data to a string and put it in localStorage.
    /*
    app.ports.setStorage.subscribe(function(state) {
        localStorage.setItem('kompost-model', JSON.stringify(state));
    });

     */
}