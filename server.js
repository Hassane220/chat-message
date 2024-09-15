var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// On gère les requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
app.use("/", express.static(__dirname + "/public"));

// On lance le serveur en écoutant les connexions arrivant sur le port 3000
http.listen(3000, function () {
    console.log(`Server is listening on *:3000`);
});

// Liste des utilisateurs connectés
var users = [];
var messages = [];

// Gestion de la connexion et de la déconnexion des utilisateurs
io.on('connection', function (socket) {
    console.log('a user connected');

    // Variable pour stocker l'utilisateur connecté
    var loggedUser = null;

    // Gestion de la connexion d'un utilisateur
    socket.on('user-login', function (user, callback) {
        // Vérification que l'utilisateur n'existe pas déjà
        var userIndex = users.findIndex(u => u.username === user.username);
        if (user && userIndex === -1) {
            // Sauvegarde de l'utilisateur et ajout à la liste des connectés
            loggedUser = user;
            users.push(loggedUser);

            // Envoi des messages de service
            var userServiceMessage = {
                text: 'You logged in as "' + loggedUser.username + '"',
                type: 'login'
            };
            var broadcastedServiceMessage = {
                text: 'User "' + loggedUser.username + '" logged in',
                type: 'login'
            };

            // Envoi du message de service au client et à tous les autres clients
            if (typeof callback === 'function') {
                callback(true);
            }
            socket.emit('service-message', userServiceMessage);
            socket.broadcast.emit('service-message', broadcastedServiceMessage);

            // Emission de 'user-login' à tous les clients
            io.emit('user-login', loggedUser);
        } else {
            // Appelle le callback s'il est défini et est une fonction
            if (typeof callback === 'function') {
                callback(false);
            }
        }

        // Envoi de l'historique des messages au nouvel utilisateur
        messages.forEach(message => {
            socket.emit(message.username ? 'chat-message' : 'service-message', message);
        });
    });

    // Gestion des messages de chat
    socket.on('chat-message', function (message) {
        if (loggedUser && loggedUser.username) {
            message.username = loggedUser.username;
            io.emit('chat-message', message);
            messages.push(message);
            if (messages.length > 150) {
                messages.splice(0, 1);
            }
        } else {
            console.log('Erreur : utilisateur non identifié');
        }
    });

    // Gestion de la déconnexion d'un utilisateur
    socket.on('disconnect', function () {
        if (loggedUser && loggedUser.username) {
            console.log('user disconnected: ' + loggedUser.username);

            // Envoi d'un message de service indiquant la déconnexion de l'utilisateur
            var serviceMessage = {
                text: 'User "' + loggedUser.username + '" disconnected',
                type: 'logout'
            };
            socket.broadcast.emit('service-message', serviceMessage);

            // Suppression de l'utilisateur de la liste des connectés
            var userIndex = users.findIndex(u => u.username === loggedUser.username);
            if (userIndex !== -1) {
                users.splice(userIndex, 1);
            }

            // Emission d'un 'user-logout' à tous les clients
            io.emit('user-logout', loggedUser);
        } else {
            console.log('Un utilisateur non identifié s\'est déconnecté');
        }
    });

    /**
 * Liste des utilisateurs en train de saisir un message
 */
 var typingUsers = [];

 /**
   * Réception de l'événement 'start-typing'
   * L'utilisateur commence à saisir son message
   */
 socket.on('start-typing', function () {
    // Ajout du user à la liste des utilisateurs en cours de saisie
    if (typingUsers.indexOf(loggedUser) === -1) {
      typingUsers.push(loggedUser);
    }
    io.emit('update-typing', typingUsers);
  });

  /**
   * Réception de l'événement 'stop-typing'
   * L'utilisateur a arrêter de saisir son message
   */
  socket.on('stop-typing', function () {
    var typingUserIndex = typingUsers.indexOf(loggedUser);
    if (typingUserIndex !== -1) {
      typingUsers.splice(typingUserIndex, 1);
    }
    io.emit('update-typing', typingUsers);
  });
  socket.on('disconnect', function () {
    if (loggedUser !== undefined) {
      // Si jamais il était en train de saisir un texte, on l'enlève de la liste
      var typingUserIndex = typingUsers.indexOf(loggedUser);
      if (typingUserIndex !== -1) {
        typingUsers.splice(typingUserIndex, 1);
      }
    }
  });



});
