var socket = io();

// Fonction pour faire défiler vers le bas
function scrollToBottom() {
    if ($(window).scrollTop() + $(window).height() + 2 * $('#messages li').last().outerHeight() >= $(document).height()) {
        $("html, body").animate({ scrollTop: $(document).height() }, 0);
    }
}

// Gestion de l'envoi de messages
$('form').submit(function(e) {
    e.preventDefault(); // On évite le rechargement de la page

    var message = {
        text: $('#m').val().trim() // On supprime les espaces autour du texte
    };

    $('#m').val(''); // On vide le champ texte
    if (message.text.length !== 0) { // Si le message n'est pas vide
        socket.emit('chat-message', message); // On émet le message au serveur
    }
    $('#chat input').focus(); // Focus sur le champ du message
});

// Gestion de la réception des messages de chat
socket.on('chat-message', function (message) {
    $('#messages').append($('<li>').html('<span class="username">' + message.username + '</span> ' + message.text));
    scrollToBottom();
});

// Gestion de la connexion utilisateur
$('#login form').submit(function (e) {
    e.preventDefault();
    var user = {
        username: $('#login input').val().trim() // On récupère le nom d'utilisateur
    };

    if (user.username.length > 0) { // Si le nom d'utilisateur n'est pas vide
        socket.emit('user-login', user); // On envoie le nom d'utilisateur au serveur
        $('body').removeAttr('id'); // Cache le formulaire de connexion
        $('#chat input').focus(); // Focus sur le champ du message
    }
});

// Gestion de la réception des messages de service
socket.on('service-message', function (message) {
    $('#messages').append($('<li class="' + message.type + '">').html('<span class="info">information</span> ' + message.text));
    scrollToBottom();
});
/**
 * Connexion d'un nouvel utilisateur
 */
socket.on('user-login', function (user) {
    $('#users').append($('<li class="' + user.username + ' new">').html(user.username));
    setTimeout(function () {
      $('#users li.new').removeClass('new');
    }, 1000);
  });
  
  /**
   * Déconnexion d'un utilisateur
   */
  socket.on('user-logout', function (user) {
    var selector = '#users li.' + user.username;
    $(selector).remove();
  });
  /**
 * Connexion de l'utilisateur
 * Uniquement si le username n'est pas vide et n'existe pas encore
 */
$('#login form').submit(function (e) {
    e.preventDefault();
    var user = {
      username : $('#login input').val().trim()
    };
    if (user.username.length > 0) { // Si le champ de connexion n'est pas vide
      socket.emit('user-login', user, function (success) {
        if (success) {
          $('body').removeAttr('id'); // Cache formulaire de connexion
          $('#chat input').focus(); // Focus sur le champ du message
        }
      });
    }
  });