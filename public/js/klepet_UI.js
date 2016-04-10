function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    

    
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    
      //dodano
      var links = editImages(sporocilo.substring(1,sporocilo.length-1),true);
      dodajElemente(links, true);
      
      //dodano
      var links2 = editYoutube(sporocilo,false);
      dodajElemente2(links2,false);
    }
    
    
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    
      //dodano
      var links = editImages(sporocilo,false);
      dodajElemente(links,false);
      
      //dodano
      var links2 = editYoutube(sporocilo,false);
      dodajElemente2(links2,false);
    
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    
    //dodano
    var links = editImages(sporocilo.besedilo,false);
    dodajElemente(links);
    
    //dodano
    var links2 = editYoutube(sporocilo.besedilo,false);
    dodajElemente2(links2);
  });
  
  //dodano
  socket.on('dregljaj', function (dregljaj) {
    console.log("prejel sem dregljaj");
    if(dregljaj.dregljaj)
    {
      var content = $('#vsebina');
      content.jrumble();
      
      content.trigger('startRumble');
      
      setTimeout(function()
      {
        content.trigger('stopRumble');
      }, 1500);
      
      console.log("Seems to be working fine.");
    }
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  }); //

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
     //dodano 8.4.2016 00:51
     $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val('/zasebno "' + $(this).text() + "\" ");
      //klepetApp.procesirajUkaz('/zasebno ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });
 

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


//dodano
function editImages(message, private)
{
  var celota = [];
  var segments = message.split(" ");
  for (var i = 0; i < segments.length; i++) 
  {
    var temp = segments[i].substring(segments[i].length-5);
    if((contains(temp,".jpg") || contains(temp,".gif") || contains(temp,".png")) && (contains(segments[i],"http://") || contains(segments[i],"https://")))
    {
      celota[i] = segments[i]; 
    }

  }
  return celota;
}

function contains(message,key)
{
  if(message.indexOf(key) != -1)
  {
    return true;
  }
  else
  {
    return false;
  }
}

function dodajElemente(elementi,private)
{
  for (var i = 0; i < elementi.length; i++) 
  {
    if(elementi[i] != null)
    {
      if((elementi[i])[0] == "\"")
      {
        elementi[i] = elementi[i].substring(1);
      }
      $("#sporocila").append("<div class='displayElement'><img style='width:200px; margin-left:20px;' src='" + elementi[i] + "'></div>");
        
    }
  }  
}

//dodano
function editYoutube(message, private)
{
  console.log("editYoutube");
  var celota = [];
  var segments = message.split(" ");
  for (var i = 0; i < segments.length; i++) 
  {
    var temp = segments[i].substring(segments[i].length-5);
    if(contains2(segments[i],"http://www.youtube.com/watch?v=") || contains2(segments[i],"https://www.youtube.com/watch?v="))
    {
      console.log("SEGMENT: " + segments[i]);
      var index1 = segments[i].indexOf("://www.youtube.com/watch?v=") + "://www.youtube.com/watch?v=".length;
      celota[i] = segments[i].substring(index1); 
      console.log(celota[i]);
    }

  }
  return celota;
}

function contains2(message,key)
{
  if(message.indexOf(key) != -1)
  {
    return true;
  }
  else
  {
    return false;
  }
}

function dodajElemente2(elementi,private)
{
  console.log("dodajElemente2");
  for (var i = 0; i < elementi.length; i++) 
  {
    if(elementi[i] != null)
    {
      if((elementi[i])[0] == "\"")
      {
        elementi[i] = elementi[i].substring(1);
      }
      //$("#sporocila").append("<div class='displayElement2'><iframe style='margin-left: 20px; width: 200px; height: 150px;' src='https://www.youtube.com/embed/" + elementi[i] + " allowfullscreen></iframe></div>");
      console.log("TOLE GLEDA: " + elementi[i]);
      $('#sporocila').append("<iframe style='width:200px; height: 150px; margin-left: 20px;' src='https://www.youtube.com/embed/" + elementi[i] + "' frameborder='0' allowfullscreen></iframe>");
      //<iframe width="560" height="315" src="https://www.youtube.com/embed/MqcFRygUpNM" frameborder="0" allowfullscreen></iframe>
      console.log("naj bi dodal");
    }
  }  
}