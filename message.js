// Messages for each person
const messages = {
  'xz335': {
    name: 'Xinxin',
    image: 'images/xinxin.JPG',
    message: `Hi Xinxin,\n\nYou have a very pure energy that I don't know how to describe. You're so curious and open-minded about every possibility. I once told Tessa that by looking at how you interacted with people, I bet Xinxin has had a very happy childhood and I still believe that. I can feel the sincere when you smile, cry, and laugh, and sometimes I'm really jealous of you. I hope you can keep showing your true self like this no matter what happens!`
  },
  'oe23': {
    name: 'Othmane',
    image: 'images/othmane.jpg',
    message: `Hi Othmane,\n\nYou're the GOAT of our team! Half of my highlights in this semester are from you. You let me join Iftar, cook for us, and again lead the midnight breakfast. I've learned so much from you, not just the dispcipline to wake up at 4:30am every day, but also the kindness and determination to help others. I hope you can keep being the person you are, and I hope we can meet again in the Morroco :)!`
  },
  'amj78': {
    name: 'Amelia',
    image: 'images/amelia.jpg',
    message: `Hi Amelia,\n\nEven though I would say you appears to be very wit and you are truly very inspiring to me, at the first we talked, I knew you were silently a "crazy" person. My theory was right after you shared your idea to get faculty together to wrestle (I really liked that idea actually). Beyond that, you're caring and thoughtful. As a person who is not caring and thoughtful at all, I have learned a lot from you. I'm glad that we got to know each other and hope to see you soon somewhere around the world! `
  },
  // Add more messages for other teammates
  'ncm32': {
    name: 'Nikka',
    image: 'images/nikka.JPG',
    message: `What's up Nikka,\n\nYou're funny. And funny people are smart. You have the charismatic energy that makes people feel so comfortable and offensive at the same time. I don't know you so well to say this but I know you can pull off anything because you have that kindness, sassiness, and thoughtfulness. I wish you can embrace the uncertainty and enjoy the life that's coming to you!`
  },
  'bp212': {
    name: 'Bikki',
    image: 'images/bikki.jpg',
    message: `Hey Bikki,\n\nThanks for being the mouth of our team. I don't think our team would be as fun as it is without you. I know that you're a busy person and you'll have even more things to do in the future, but if you ever feel like you're overwhelmed, just remember that you've already had deep connections with the people here. I wish you resilience, happiness, and become the person want to be with no regrets :).`
  },
  'th358': {
    name: 'Minnie',
    image: 'images/minnie.jpg',
    message: `Dear Minnie,\n\nYou said you felt like our team was a family, I actually didn't agree at first and thought you were so naive to think that way... But after spending time here, I could see why you said that and I think we all can see that. Thank you for accompanying us to the midnight breakfast, Wuxi, karaoke, and everything. I wish I could talk to you more and get to know you better. I don't know when the next time we meet is, but I hope it'd be in Europe. If you every feel like you have existential crisis (and I know you will at some point), text me, I'll give you some tips :).`
  },
  'fjh5': {
    name: 'Faith',
    image: 'images/faith.JPG',
    message: `Dear Faith,\n\nYou're so humble and nice. I mean I know people like you exist, but I never thought I would meet one in person. You care about everyone and always support them. I'm just afraid that one day you'll be tired of taking care of others...Just in case that happens, please remember that you can always take many breaks and be a little selfish. We are always here for you (I mean not always in terms of timezone but you know just shoot a message and you'll get replied in 2 business days). I really want to thank you for just your presense. I wish you the best in everything! `
  },
  'pjd18': {
    name: 'Patrick',
    image: 'images/patrick.JPG',
    message: `Dear Patrick,\n\nTo be honest, I used to think you're a little fake and just trying to be nice to everyone because it's your job (Sorry I assume everyone is bad until they're proven to be good). But I can see your effort to be a supportive and lovely person that I don't think is in your job description. You has helped me open up and be more confident in my creativity and weirdness (which I think you've already regretted). Although I don't cry like Xinxin or Nikka, I hope you know that I've always looked up to you and learned a lot from you since being an OA. Please don't cry when you read this, it'll make people question what you're reading. I wish you could keep up this energy and get loved by more and more people around you. `
  },
  'cic6': {
    name: 'Zia',
    image: 'images/zia.jpg',
    message: `Hi Zia,\n\nI hope you're enjoying your time at home. We haven't heard from you in a while and I really want to catch up when you're here. You're always so positive (maybe not always but I know you have a positive mindset) and happy except when you were doing SigWork. I wonder if you ever feel exhausted just to keep that positivity up because I do and that's why I admire you so much. So sorry I could not visit you in Lunar New Year because the flight was so crazy expensive. But when I save up enough money, I'll come! I wish the time you spent with us has been a good memory for you and I wish you all the luck and happiness.`
  },
  'sl879': {
    name: 'Sheng En',
    image: 'images/shengen.jpg',
    message: `Hi Sheng En,\n\nThanks for your skateboard, it really helps me a lot. Thanks for the flower vase from your ex, it really suits the sunflower I bought. Thanks for helping Tessa create handicap-friendly shoes :), I really appreciate that. I know you're among the youngest in our team but I think you're the smartest (just look the classes you took, we can all tell that). I hope you can show more of yourself, your creativity, and your kindness to the world. I bet you can replace my position as the menace of our team. I wish you everything you want in life!`
  },
  'jrc123': {
    name: 'Jesse',
    image: 'images/jesse.JPG',
    message: `Yo Jesse,\n\nYou know I'm always jealous of your piano talent since Duke? I mean I've tried to learn by myself but it's so hard. Anyway, thanks for being a part of our team and for being so supportive. I know you are very bright and talented so it'll be extra to wish you good luck. But everyone needs a little luck to be successful, so I wish you all the luck!`
  },
  'md459': {
    name: 'Khoi',
    image: 'images/khoi.jpg',
    message: `Zup Khoi,\n\nI hope you enjoyed your time in the US. I don't really know you so well except for the fact that you're a very smart and humourous person. I also didn't even know you can sing acapella until last year, bro is doing side quest, so talented. I don't know what you're up to in the future but remember that you can always be yourself and be happy. I wish you find the joy in everything you do!`
  },
  'lq55': {
    name: 'Coco',
    image: 'images/coco.jpg',
    message: `Hi Coconut,\n\nHow's US? I haven't had chance to say thank you for your gift so I'd say here. Thank you! I hope you have had great time at Duke, met many new friends, and had good memories with them. The first time we talked, I thought you were just a dumb and naive person who didn't care about anything (you don't know where Viet Nam is). But after spending time with you and the team, I can see you care about everyone in a very unique way. I think you are very warm and considerate, and I hope you can keep being that person. I wish you will have more memorable moments for the rest of the time at DKU!`
  },
  'nlt19': {
    name: 'Audrey',
    image: 'images/audrey.jpg',
    message: `Hi Audrey,\n\nI was about to write something in Vietnamese but it'll increase my social awkwardness level to 1000. I feel that you're the most mature person in some of the aspects. A very smart and mindful person. I also know know you're sentimental through all of your poems you made and I think that's very beautiful. No matter how hard life strikes you, keep that caring heart open and I bet you'll be loved by many people!`
  },
  'yh327': {
    name: 'Iffy',
    image: 'images/iffy.jpg',
    message: `Hi Iffy,\n\nI guess we've only interacted a few times. The karaoke, some team meetings, and the one time you came to eat Pani Puri with us. With just those few interactions, I can only say you're a good target for my jokes and liars =))))). I wish we'd have more time to get to know each other and more time for me to make fun of you haha. I hope you can have more good memories with the team next year. The experience as being RA has taught me a lot and I hope it will be the same for you. Wish you all the best!`
  },
  'ph155': {
    name: 'Peilin',
    image: 'images/peilin.jpg',
    message: `Hi Peilin,\n\nEveryone in our team knows that I'm half French now, you know? I'll be back in my home country in a few weeks, so if you're going to visit Paris, let me know, I'll show you around. Anyway, do you enjoy US? Look at your IG stories, I bet you have a lot of fun. I know you're a little shy and introverted (at least to me) but I hope you can open up more and share your true self with us. I wish your last year at DKU will be full of joy and happiness. Stack that bag with awesome memories and happiness!`
  },
  'tat30': {
    name: 'Tekla',
    image: 'images/tekla.JPG',
    message: `Umm Tekla,\n\nI didn't know that you were that funny. Certified joke of the team. You're also giving out bossy vibe. I don't like bossy people but you're bossy and get shit done so that's a pass. Anyway, I do feel very lucky to have you on the team for this semester. You create a different dynamic but can still keep that menace vibe of courtyard 3. I'd love to spend more time here to get to know more about you and what you do because from your IG, it's very cool to see you solo travel a lot. But I guess this might be the last or second last time we talk already. I wish you all the best and have a bunch of good memories with these people in your last semester.`
  },
  'nt119': {
    name: 'Nika',
    image: 'images/nika.JPG',
    message: `Hi Nika,\n\nDo you know the longest talk we had was in the sauna? Just a random fact but anyway, I always feel that you're very confident or at least appear to be confident. Even when you said you're uncertain about the future, you seems to be well-prepared for that, mentally. In either way, I really admire that about you and want to get just of bit of that mentality for myself. I truly appreciate your presence in our team and hope you can have more cool experiences in the future!`
  },
  'wh174': {
    name: 'Vivian',
    image: 'images/vivian.JPG',
    message: `Hi Vivian,\n\nI don't know you well enough to say anything about you. But I hope that you have had a great time with this crazy team. I wish we could have more time but I know we all have our own things to worry about. For the rest of the time at DKU, I wish you can make the most out of it, have a lot of fun, and learn many new things as you interact with more people. I manifest happiness, peacefulness, and joy for you!`
  },
  'yh459': {
    name: 'Belinda',
    image: 'images/belinda.JPG',
    message: `Hi Belinda,\n\nYou're the most dedicated person I know. As Patrick said in the EoY celebration, you've been sent to the most chaotic team and still managed to keep that positive energy whenever we come to you. I know you're very busy and tired and I truly hope you have some time to relax. I don't know anything about your experience in DKU but I'm sure the longer you stay here, the more you'll love this place. Not because of place (Kunshan is actually so boring) but because of the people that will come and go through your time here. I wish you can find your joy and shed more happy tears just like Patrick. I'm really grateful that you're our RLC for this semester!`
  }
};

// Default message if nothing else matches
const defaultMessage = {
  name: 'Friend',
  image: 'images/placeholder.jpg',
  message: `Thank you for being part of our amazing team! Your contributions and presence have made this experience special for all of us.\n\nWith appreciation,\n[Your Name]`
};

// Define available JPG team photos (excluding HEIC files that might not render in all browsers)
const teamPhotos = [
  'team%20images/1.JPG',
  'team%20images/2.JPG',
  'team%20images/3.JPG',
  'team%20images/4.JPG',
  'team%20images/5.JPG',
  'team%20images/7.JPG',
  'team%20images/8.JPG',
  'team%20images/9.JPG',
  'team%20images/10.JPG',
  'team%20images/12.JPG',
  'team%20images/13.JPG',
  'team%20images/14.JPG',
  'team%20images/15.JPG',
  'team%20images/16.JPG',
  'team%20images/17.JPG',
  'team%20images/18.jpg',
  'team%20images/19.jpg',
  'team%20images/20.jpg',
  'team%20images/21.jpg',
  'team%20images/22.jpg',
  'team%20images/23.jpg',
  'team%20images/24.jpg',
  'team%20images/25.jpg',
  'team%20images/26.jpg',
  'team%20images/27.jpg',
  'team%20images/28.jpg',
  'team%20images/29.jpg',
  'team%20images/30.jpg',
  'team%20images/31.jpg',
  'team%20images/32.jpg',
  'team%20images/33.jpg',
  'team%20images/34.jpg',
  'team%20images/35.jpg',
  'team%20images/36.jpg',
  'team%20images/37.jpg',
  'team%20images/38.jpg',
  'team%20images/39.jpg',
  'team%20images/40.jpg',
  'team%20images/41.jpg',
  'team%20images/42.jpg',
  'team%20images/43.jpg',
  'team%20images/44.jpg',
  'team%20images/45.jpg',
  'team%20images/46.jpg',
  'team%20images/47.jpg',
  'team%20images/48.jpg',
  'team%20images/49.jpg',
  'team%20images/50.jpg',
  'team%20images/51.jpg'
];

// Get the NetID from the URL
const urlParams = new URLSearchParams(window.location.search);
const netId = urlParams.get('netId');
const characterId = urlParams.get('character');

// Apply custom cursor if available
window.addEventListener('DOMContentLoaded', () => {
  console.clear();
  console.log("DOM Content Loaded - LOADING STARTED");
  
  // Debug element removed
  
  try {
    // Make sure loading message is visible
    const loadingMessage = document.getElementById('bubbleLoadingMessage');
    if (loadingMessage) {
      loadingMessage.style.display = 'block';
      loadingMessage.style.visibility = 'visible';
      loadingMessage.style.opacity = '1';
      console.log("LOADING MESSAGE DISPLAYED");
    }
    
    // Continue with regular initialization
    initScrollAnimations();
    applyCustomCursor();
    setupPersonalMessage();
    setupLightbox();
    setupSnapScrolling();
    
    // Handle URL hash for direct section access
    if (window.location.hash) {
      setTimeout(() => {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
    
    // Make fade-in elements visible immediately if there's an issue
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => {
        if (!el.classList.contains('visible')) {
          el.classList.add('visible');
        }
      });
    }, 1000);
    
    // Add smooth scrolling for all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // Now setup bubble gallery with delay to ensure loading message appears first
    console.log("Setting up bubble gallery in 500ms...");
    setTimeout(() => {
      setupBubbleGallery();
    }, 500);
    
    console.log("Initialization complete");
  } catch (error) {
    console.error("Error during initialization:", error);
    // Make sure content is visible even if there's an error
    document.querySelectorAll('.fade-in').forEach(el => {
      el.classList.add('visible');
    });
  }
});

// Apply custom cursor
function applyCustomCursor() {
  const customCursor = localStorage.getItem('customCursor');
  if (customCursor) {
    try {
      // Apply cursor to body
      document.body.style.cursor = `url(${customCursor}) 32 32, auto`;
      
      // Apply cursor to interactive elements
      const cursorStyle = `url(${customCursor}) 32 32, auto`;
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        a, button, input, .bubble, [role="button"] {
          cursor: ${cursorStyle} !important;
        }
      `;
      document.head.appendChild(styleSheet);
      console.log("Custom cursor applied");
    } catch (error) {
      console.error("Error applying custom cursor:", error);
    }
  }
}

// Display the personalized message
function setupPersonalMessage() {
  console.log("Setting up personal message");
  const messageContainer = document.getElementById('personalMessage');
  const profileImage = document.getElementById('profile-image');
  const profileName = document.getElementById('profile-name');
  
  console.log("NetID received:", netId);
  console.log("Character ID received:", characterId);
  
  try {
    // Display based on NetID if available
    if (messages[netId]) {
      console.log("Message found for netId:", netId);
      messageContainer.textContent = messages[netId].message;
      profileImage.src = messages[netId].image;
      profileName.textContent = messages[netId].name;
    } 
    // Fallback to default message
    else {
      console.log("No message found for netId:", netId, "- using default");
      messageContainer.textContent = defaultMessage.message;
      profileImage.src = defaultMessage.image;
      profileName.textContent = defaultMessage.name;
    }
  } catch (error) {
    console.error("Error setting up personal message:", error);
    messageContainer.textContent = "An error occurred while displaying your message. Please try again.";
  }
}

// Setup for the bubble gallery
function setupBubbleGallery() {
  console.clear();
  console.log("%c LOADING MEMORIES... PLEASE WAIT ", "background: black; color: yellow; font-size: 20px; padding: 10px;");
  
  try {
    const bubbleGallery = document.getElementById('bubbleGallery');
    if (!bubbleGallery) {
      console.error("ERROR: Bubble gallery element not found");
      return;
    }
    
    // Clear any existing content
    bubbleGallery.innerHTML = '';
    
    // Get the existing loading message and make sure it's VERY visible
    const loadingMessage = document.getElementById('bubbleLoadingMessage');
    if (loadingMessage) {
      loadingMessage.style.display = 'block';
      loadingMessage.style.visibility = 'visible';
      loadingMessage.style.opacity = '1';
      loadingMessage.style.zIndex = '1000';
      console.log("LOADING MESSAGE CONFIRMED VISIBLE");
    } else {
      console.error("ERROR: Loading message element not found");
    }
    
    console.log(`Creating bubbles for ${teamPhotos.length} images`);
    
    // Create an array to track loaded bubbles
    const bubbles = [];
    
    // Create bubbles for each team photo
    let loadedImages = 0;
    const totalImages = teamPhotos.length;
    
    teamPhotos.forEach((photo, index) => {
      // Create the bubble element first
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'bubble';
      
      // Add to DOM immediately to be visible
      bubbleGallery.appendChild(bubbleDiv);
      bubbles.push(bubbleDiv);
      
      // Set a placeholder background initially
      bubbleDiv.style.backgroundImage = 'url("images/placeholder.jpg")';
      
      // Get dimensions for full screen
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Random size between 80px and 150px
      const randomSize = 80 + Math.random() * 70;
      
      // Calculate maximum positions to keep bubbles fully on screen
      const maxX = viewportWidth - randomSize - 20; 
      const maxY = viewportHeight - randomSize - 20;
      
      // Position within safe boundaries to prevent off-screen floating
      let x = 20 + Math.random() * (maxX - 40);
      let y = 20 + Math.random() * (maxY - 40);
      
      // Apply size and position
      bubbleDiv.style.width = `${randomSize}px`;
      bubbleDiv.style.height = `${randomSize}px`;
      bubbleDiv.style.left = `${x}px`;
      bubbleDiv.style.top = `${y}px`;
      
      // Add random animation
      const duration = 20 + Math.random() * 20;
      const delay = Math.random() * 10;
      const animTypes = ['float', 'floatAlt', 'floatWide'];
      const animType = animTypes[Math.floor(Math.random() * animTypes.length)];
      
      bubbleDiv.style.animationName = animType;
      bubbleDiv.style.animationDuration = `${duration}s`;
      bubbleDiv.style.animationDelay = `-${delay}s`;
      
      // Random animation direction
      if (Math.random() > 0.5) {
        bubbleDiv.style.animationDirection = 'alternate-reverse';
      } else {
        bubbleDiv.style.animationDirection = 'alternate';
      }
      
      // Set random z-index for depth
      bubbleDiv.style.zIndex = Math.floor(Math.random() * 8) + 2;
      
      // Now load the actual image
      const img = new Image();
      img.src = photo;
      
      img.onload = function() {
        // Once image is loaded, update bubble style
        bubbleDiv.style.backgroundImage = `url('${photo}')`;
        bubbleDiv.dataset.fullImage = photo;
        
        // Add click event for lightbox
        bubbleDiv.addEventListener('click', () => {
          openLightbox(photo);
        });
        
        // Track loaded images
        loadedImages++;
        console.log(`Loaded image ${loadedImages} of ${totalImages}: ${photo.split('/').pop()}`);
        
        // Update the loading message text to show progress
        if (loadingMessage) {
          loadingMessage.innerHTML = `⚠️ LOADING MEMORIES... ${loadedImages}/${totalImages} ⚠️`;
        }
        
        if (loadedImages === totalImages) {
          console.log("ALL IMAGES LOADED! Hiding loading message in 1 second...");
          setTimeout(() => {
            hideLoadingMessage();
          }, 1000);
        }
      };
      
      img.onerror = function() {
        console.error(`ERROR: Failed to load image: ${photo}`);
        // Still increment counter so we can finish loading eventually
        loadedImages++;
        
        // Set a default color for failed bubbles
        bubbleDiv.style.backgroundImage = 'none';
        bubbleDiv.style.backgroundColor = '#333';
        
        if (loadedImages === totalImages) {
          hideLoadingMessage();
        }
      };
    });
    
    // If all images are already loaded from cache
    setTimeout(() => {
      if (loadedImages === totalImages) {
        console.log("Images already loaded from cache");
        hideLoadingMessage();
      } else {
        console.log(`Still loading images: ${loadedImages} of ${totalImages} loaded`);
      }
    }, 2000);
    
    // Add a long timeout as a safety to hide loading message even if some images fail
    setTimeout(() => {
      if (loadedImages < totalImages) {
        console.log(`Long timeout reached. Only ${loadedImages} of ${totalImages} images loaded. Hiding loading message anyway.`);
        hideLoadingMessage();
      }
    }, 10000); // 10 seconds timeout
    
  } catch (error) {
    console.error(`ERROR in setupBubbleGallery: ${error.message}`);
    hideLoadingMessage();
  }
}

// Lightbox functionality
function setupLightbox() {
  try {
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightboxClose');
    
    if (!lightbox || !lightboxClose) {
      console.error("Lightbox elements not found");
      return;
    }
    
    // Close lightbox when clicking the close button
    lightboxClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeLightbox();
    });
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
    
    // Close lightbox when pressing escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    });
    
    console.log("Lightbox setup complete");
  } catch (error) {
    console.error("Error setting up lightbox:", error);
  }
}

function openLightbox(imageUrl) {
  try {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    if (!lightbox || !lightboxImage) {
      console.error("Lightbox elements not found");
      return;
    }
    
    console.log("Opening lightbox for image:", imageUrl);
    
    // Disable scrolling on body immediately to prevent jumps
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden'; // Also lock html element
    
    // Create a new image to ensure it's loaded before showing
    const img = new Image();
    
    img.onload = function() {
      // Set the image source after it's loaded
      lightboxImage.src = imageUrl;
      
      // Show the lightbox
      lightbox.classList.add('active');
      
      // Ensure the lightbox is focused for keyboard events
      lightbox.setAttribute('tabindex', '-1');
      lightbox.focus();
      
      console.log("Lightbox opened and image loaded");
    };
    
    img.onerror = function() {
      console.error("Failed to load image:", imageUrl);
      // Re-enable scrolling since we won't show the lightbox
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      alert("Sorry, the image could not be loaded.");
    };
    
    // Start loading the image
    img.src = imageUrl;
  } catch (error) {
    console.error("Error opening lightbox:", error);
    // Make sure we re-enable scrolling if there's an error
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

function closeLightbox() {
  try {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    if (!lightbox) {
      console.error("Lightbox element not found");
      return;
    }
    
    console.log("Closing lightbox");
    
    // Hide the lightbox
    lightbox.classList.remove('active');
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Wait for transition to complete before clearing the image
    setTimeout(() => {
      if (lightboxImage) {
        lightboxImage.src = '';
      }
    }, 300);
  } catch (error) {
    console.error("Error closing lightbox:", error);
    // Make sure scrolling is re-enabled even if there's an error
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

// Initialize scroll animations
function initScrollAnimations() {
  try {
    // Animation for sections
    const fadeElements = document.querySelectorAll('.fade-in');
    
    if (fadeElements.length === 0) {
      console.warn("No fade-in elements found");
      return;
    }
    
    console.log("Setting up animations for", fadeElements.length, "elements");
    
    // Intersection Observer for fade-in elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });
    
    // Observe each fade-in element
    fadeElements.forEach(element => {
      observer.observe(element);
    });
    
    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(20px, -20px) rotate(5deg); }
        50% { transform: translate(0, -40px) rotate(0deg); }
        75% { transform: translate(-20px, -20px) rotate(-5deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Error initializing scroll animations:", error);
  }
}

// Setup enhanced wheel-based snap scrolling
function setupSnapScrolling() {
  try {
    const sections = Array.from(document.querySelectorAll('.message-screen, .bubble-gallery, .team-message-screen'));
    
    if (sections.length === 0) {
      console.warn("No sections found for snap scrolling");
      return;
    }
    
    console.log(`Setting up smooth navigation for ${sections.length} sections`);
    
    // Track current section
    let currentSectionIndex = 0;
    let isTransitioning = false;
    
    // Initial section visibility
    sections.forEach((section, index) => {
      if (index === 0) {
        section.style.display = 'flex';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      } else {
        section.style.display = 'none';
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
      }
    });
    
    // Add transition styles
    const style = document.createElement('style');
    style.textContent = `
      .message-screen, .bubble-gallery, .team-message-screen {
        transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
      }
    `;
    document.head.appendChild(style);
    
    // Function to smoothly transition to a section
    function goToSection(targetIndex) {
      if (isTransitioning || targetIndex === currentSectionIndex || 
          targetIndex < 0 || targetIndex >= sections.length) {
        return;
      }
      
      isTransitioning = true;
      
      // Direction of movement (for transform)
      const goingDown = targetIndex > currentSectionIndex;
      
      // Fade out current section with transform
      const currentSection = sections[currentSectionIndex];
      currentSection.style.opacity = '0';
      currentSection.style.transform = goingDown ? 'translateY(-50px)' : 'translateY(50px)';
      
      // After fade out, show new section
      setTimeout(() => {
        currentSection.style.display = 'none';
        
        // Prepare and show target section
        const targetSection = sections[targetIndex];
        targetSection.style.display = 'flex';
        targetSection.style.opacity = '0';
        targetSection.style.transform = goingDown ? 'translateY(50px)' : 'translateY(-50px)';
        
        // Force a reflow to ensure the browser processes the display change
        void targetSection.offsetWidth;
        
        // Fade it in
        setTimeout(() => {
          targetSection.style.opacity = '1';
          targetSection.style.transform = 'translateY(0)';
          
          // Update current section
          currentSectionIndex = targetIndex;
          
          // Reset transitioning flag after animation completes
          setTimeout(() => {
            isTransitioning = false;
          }, 800);
        }, 20);
      }, 800);
    }
    
    // Keyboard navigation
    window.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        goToSection(currentSectionIndex + 1);
        event.preventDefault();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        goToSection(currentSectionIndex - 1);
        event.preventDefault();
      }
    });
    
    // Mouse wheel navigation with debounce
    let wheelTimeout;
    window.addEventListener('wheel', function(event) {
      event.preventDefault();
      
      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
      }
      
      wheelTimeout = setTimeout(() => {
        if (event.deltaY > 0) {
          goToSection(currentSectionIndex + 1);
        } else if (event.deltaY < 0) {
          goToSection(currentSectionIndex - 1);
        }
      }, 100);
    }, { passive: false });
    
    // Clean up any existing navigation elements
    const existingNav = document.querySelector('.screen-nav');
    if (existingNav) {
      existingNav.remove();
    }
    
    const existingDots = document.querySelector('.nav-dots');
    if (existingDots) {
      existingDots.remove();
    }
    
    // Handle direct links with hash
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const targetIndex = sections.findIndex(section => section.id === targetId);
      if (targetIndex !== -1) {
        // Set immediately without animation for direct links
        sections.forEach((section, index) => {
          if (index === targetIndex) {
            section.style.display = 'flex';
            section.style.opacity = '1';
          } else {
            section.style.display = 'none';
            section.style.opacity = '0';
          }
        });
        currentSectionIndex = targetIndex;
      }
    }
    
    console.log("Smooth navigation setup complete");
  } catch (error) {
    console.error("Error setting up navigation:", error);
  }
}

// Helper function to hide the loading message
function hideLoadingMessage() {
  const loadingMessage = document.getElementById('bubbleLoadingMessage');
  if (loadingMessage) {
    console.log("Hiding loading message");
    loadingMessage.style.opacity = '0';
    setTimeout(() => {
      loadingMessage.style.display = 'none';
      console.log("Loading message hidden");
    }, 500);
  } else {
    console.error("ERROR: Loading message element not found");
  }
}
