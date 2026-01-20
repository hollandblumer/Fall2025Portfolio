// src/data/projectData.js
const projectData = {
  meredithnorvell: {
    slug: "meredithnorvell",
    title: "Meredithnorvell.com",
    tagLine:
      "Designed and built with interactive book elements that steal the show.",
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" },
    hero: {
      video:
        "https://cdn.dribbble.com/userupload/40963070/file/original-9d0283154634708e5626d91e4a7f3adb.mp4",
      alt: "Meredith Norvell — hero still",
    },
    sections: [
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/40963070/file/original-9d0283154634708e5626d91e4a7f3adb.mp4",
        caption: "Home page of meredithnorvell.com",
        loop: true,
      },
      {
        type: "text",
        content: `Meredithnorvell.com is for publishers and social media followers to visit and browse. In our first session, we pulled together what the client already had: her logo, color scheme, professional headshots, and a Pinterest board of inspiration for her upcoming book. We also walked through websites that stood out to her and unpacked what she liked about them.

Towards the end of the meeting, I pulled up elements that caught my eye for this website, ones I had already compiled into a style guide ahead of time. My style guide is usually a Google Slides deck, with a slide for each component that separates a professionally designed website from the others—custom menu, loader, banner, font mix, color palette, scroll features, and subtle animations. Ultimately, we picked the best headshot for the homepage, of her reading on the couch that was horizontal, and both loved the idea of using a book loader animation.`,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40987294/file/original-5e40d2d2b3a6451793b392fd3aecb51c.webp?resize=1504x774&vertical=center",
        alt: "Mood board",
        caption: "Idea board that includes pictures and images of work",
      },
      {
        type: "text",
        content: `Post-meeting, while messing around with the book animation, I noticed it sort of looked like a menu and thought it would be cool if it was one. So I got to work, reversing the way the animation opened and closed, reducing the number of pages, making it open and close only once, and moving it to the top left corner of the screen once it opened and closed in the center. Early on, I realized I had to consider browser compatibility because the pages were flipping upside down on Safari. Since Safari struggles with rotateZ(180deg), I adjusted it to 179 degrees, and that did the trick. Once the closed book transitioned to the upper left corner, I set its display to none so that book2 could take its place. That way, when you clicked on book2, it would open a sliding menu. I also had to convert the code to simple HTML, CSS, and JS in case we were to inject it into a website builder like Wix. Due to time constraints, I passed the baton of book2’s sliding menu to the global team I’ve assembled. The header looked a little left-heavy with the book, especially on mobile, so I decided to add a custom-designed page ear on the right corner that served as a button when clicked, leading to the client's upcoming book.`,
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/40987299/file/original-31541fc7c70092556a2e00245016f223.mp4",
        caption: "Bright Silicon Stars Page on Meredithnorvell.com",
        loop: true,
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/40987297/file/original-ac0fb1e55139989e8c6e9df8605ac540.mp4",
        caption: "Social media reel for client based on web page animation",
        loop: true,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40987295/file/original-f494f73442597098b9f027d7aae1ac6d.webp?resize=1504x777&vertical=center",
        alt: "About",
        caption: "About Page of Meredithnorvell.com",
      },
      {
        type: "text",
        content:
          "For the about page, I kept it simple. I didn’t want to use the same concept as the Bright Silicon Stars book page to display photos, so I found a 2x2 gallery on Canva and put a flower in the middle, and exported it as an svg. Same with the contact form. Though, I really wanted to make it more fun by adding an interactive envelope, which I started here. Due to time constraints, I just made the contact page different colors and simple yet elegant. Thrilled with how this website turned out. Visit meredithnorvell.com to view it live.",
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40987296/file/original-17caa51c2656694265c63939b13fe700.png?resize=1504x855&vertical=center",
        alt: "Contact",
        caption: "Contact Page",
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/40987298/file/original-1ce09837614ef019e0ec13a06959b249.mp4",
        caption: "Initial animation for contact form",
        loop: true,
      },
    ],
  },
  cherylfudge: {
    slug: "cherylfudge",
    title: "Cherylfudge.com",
    tagLine:
      "A website design that compliments Cheryl Fudge's modern, dynamic art with a nod to Nantucket.",
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" }, // Placeholder for palette based on blue/coast theme
    hero: {
      video:
        "https://cdn.dribbble.com/userupload/42644442/file/original-353d0c120621f000d8cad934ecf17513.mp4",
      alt: "Cheryl Fudge website hero video",
    },
    sections: [
      {
        type: "text",
        content: `
Cheryl and I had our first meeting for her website on a beach in Nantucket, looking out at the harbor. While we caught up, I asked what inspires her. She pointed straight to the water. From there, I gathered images of what moves her, along with her art and past work, to shape the site.`,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/42644906/file/original-1cd7acd7d13cdefb4a7a67bc4f08b3eb.jpeg?resize=1504x1128&vertical=center",
        alt: "Nantucket harbor inspiration",
        caption: "Inspiration for Cheryl Fudge's Website",
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/42644905/file/original-4cd165f70da4304c06a04323bdff5204.jpeg?resize=1504x2005&vertical=center",
        alt: "Smokey lines art inspiration",
        caption: "Smokey Lines that Cheryl Fudge Enjoys Painting",
      },
      {
        type: "text",
        content: `
Off the bat, I knew the color scheme would lean blue. I landed on a muted, cool shade to balance all the colors in Cheryl’s art. From there, I turned to CodePen and Pinterest, keeping her inspiration in mind, to find elements that felt fluid and echoed the coast. A few generative art pieces and SVG filters stood out to me.`,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/42645387/file/original-b2b55f78fe3ff7010ffd4d35e3433246.png?resize=1504x733&vertical=center",
        alt: "Sandy flow field component",
        caption:
          "Sandy Flow Field, Which I Used as the Background for Website Components Found on My CodePen",
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/42644553/file/original-3af659af7e626b376168772477bb0edd.png?resize=1504x765&vertical=center",
        alt: "Interiors page screenshot",
        caption: "Interiors Page Featuring Cheryl's Interior Design Work",
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/42644554/file/original-c4964ccb325edb6612777a0a937c961f.mov",
        caption:
          "About Page on Cherylfudge.com, Inspired by the Smokey Lines She Draws",
        loop: true,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/42645386/file/original-0174ee2676388fbf51492f41a65de65b.png?resize=1504x797&vertical=center",
        alt: "Homepage gallery layout",
        caption: "Gallery Layout for the Home Page of Cherylfudge.com",
      },
      {
        type: "text",
        content:
          "For the home page, I was inspired by a lot of gallery wall layouts I’ve seen, especially those using Three.js. Still, I wanted something that felt more fluid and more like water. I explored a few options that featured her work but ultimately landed on a concept built with plain CSS, which is even better for browser compatibility. ",
      },
    ],
  },
  americanseasons: {
    slug: "americanseasons",
    title: "Buzz-Worthy SVG Tracer Animation for American Seasons",
    tagLine:
      "Custom SVG tracer animation brings the restaurant's logo to life for dynamic social media content.",
    palette: { bg: "#F4F7EF", ink: "#212121" }, // Placeholder for palette based on bee/seasons
    hero: {
      video:
        "https://cdn.dribbble.com/userupload/43999509/file/original-cb29508e406a48e6a079f3f13d1283e3.mp4",
      alt: "American Seasons SVG Tracer Animation Demo",
    },
    sections: [
      {
        type: "text",
        content:
          "Neil, the owner and head chef of American Seasons, reached out looking for more dynamic Instagram content ahead of their seasonal opening on Nantucket.",
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/43999509/file/original-cb29508e406a48e6a079f3f13d1283e3.mp4",
        caption:
          "SVG Tracer Animation in action for the American Seasons Instagram reel.",
        loop: true,
      },
      {
        type: "text",
        content:
          "Inspired by the bee in their logo, I created a custom SVG tracer animation using JavaScript to animate a curly pollen path. I pulled everything together in Canva to produce an Instagram reel that brings their logo to life.",
      },
    ],
  },
  katherinegroverfinejewelry: {
    slug: "katherinegroverfinejewelry",
    title: "Canvas of Jewels for Katherine Grover Fine Jewelry",
    tagLine:
      "A custom canvas-based particle system that uses jewels as interactive particles to form Nantucket Island",
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" }, // Placeholder for palette based on fine jewelry/canvas
    hero: {
      video:
        "https://cdn.dribbble.com/userupload/43826090/file/original-8a677209789bca38ccbf0b3c835cccc6.mp4",
      alt: "Katherine Grover Fine Jewelry Canvas Particle Animation",
    },
    sections: [
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/43826090/file/original-8a677209789bca38ccbf0b3c835cccc6.mp4",
        caption: "The particle animation forming Nantucket.",
        loop: true,
      },
      {
        type: "text",
        content: `**Concept**  
For Katie, founder of Katherine Grover Fine Jewelry, I created a custom canvas particle animation using her own jewelry designs as the particles. She wanted an animation she could use across email marketing and Instagram ads that maintained a clean, elevated feel while introducing movement.`,
      },
      {
        type: "text",
        content: `**Approach**  
I designed the system so the particles form around the shape of Nantucket Island rather than filling it in. Katie’s logo sits in the negative space at the center, giving the composition a clear focal point while keeping the overall layout minimal.`,
      },
      {
        type: "text",
        content: `**Implementation**  
The animation is built with a custom canvas particle system adapted from an interactive logo tutorial. I reversed the particle coverage logic, used a base64 island image as a reference mask, and mapped high-resolution jewelry images across the canvas using getImageData(). The motion responds to mouse and touch, runs on GSAP’s ticker for smooth performance, and stays sharp on retina displays.`,
      },
      {
        type: "text",
        content: `**Outcome**  
The final animation gave Katie a flexible, high-impact visual she could use across marketing channels. She was thrilled with the result.`,
      },
    ],
  },
  madewithlove: {
    slug: "madewithlove",
    title: "When it comes together like this, it’s Valentine’s Day post-worthy",
    tagLine:
      "A generative art animation using thread-like strokes to form a heart and the text 'Made with Love' for a social media post.",
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" }, // Placeholder for palette based on Valentine's Day/Love/Red
    hero: {
      video:
        "https://cdn.dribbble.com/userupload/40906361/file/original-391a3ed9ce0b7e144eca01fb724be566.mp4",
      alt: "Made with Love generative thread animation",
    },
    sections: [
      {
        type: "text",
        content:
          "This is the version I made for Cheryl Fudge who makes one of a kind art and clothing based in Nantucket, MA. Much like the title, a lot of love went into making the components of this Valentine’s Day post for a client in Nantucket, MA. Some of these elements, in fact, had been archived months ago, as I waited for the right moment to string them all together.",
      },
      {
        type: "text",
        content: `
The inspiration for this project stemmed from a piece I saw on Pinterest, designed by Tiffany Lo. The free-flowing continuity of the thread and how it formed the text, coupled with the subtle shift in thick and thin organic lines, stood out to me. I was also drawn to the idea of “beginning anywhere”. Cut to down the line, I came across a generative art code featured on CodePen that mimicked the thread-like, random behavior, and I quickly made the connection.`,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40906355/file/original-eafad0fda00dfee0430907aee38da23c.jpg?resize=1504x1945&vertical=center",
        alt: "Tiffany Lo's thread art inspiration",
        caption: "Inspiration piece designed by Tiffany Lo.",
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40906356/file/original-e2ddf43f59fe2aded87d11258d8511f4.webp?resize=1504x1200&vertical=center",
        alt: "Generative art code inspiration screenshot",
        caption: "Screenshot of the generative art code found on CodePen.",
      },
      {
        type: "text",
        content: `
Knowing that this was the start of something good, I had to look under the hood. I was impressed by the idea of creating thread-like strokes with randomized color values, such as:
\`c.strokeStyle = "rgba(51," + Math.floor(Math.random() * 100 + 55) + ",51,1)"\`
and the fact that the code draws 200 tiny line segments per frame. With the animation running at 60 frames per second, that results in 12,000 lines drawn per second. I messed around with different values, thicknesses, and colors until I found something that felt smooth. I also noticed that the original code was still drawing transparent lines outside the canvas, making it less efficient. I fixed that and added boundaries in the center for the points to navigate around.`,
      },
      {
        type: "text",
        content: `
While brainstorming for a Valentine’s Day post, I decided to shape the boundaries in the center into a heart. To make it work within the canvas, I adjusted the coordinate system by flipping the heart’s y-values, negating \`py - heartY\` before applying the heart equation. This ensured the shape rendered correctly.

Next, I needed to find a font that would work in the center. I found inspiration from a poster  and had Lino, a similar font, as a reference. I worked with a designer to refine the lettering's curls and swoop placement. Considering the client’s clothes are all one-of-a-kind and handmade, "Made with Love" felt like the perfect fit. I fine-tuned everything in Adobe Illustrator to get the final vector shape.`,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40906357/file/original-b415dea5683426c1a6e0b52dcc6a27c4.webp?resize=1504x2126&vertical=center",
        alt: "Deepfried friends concept poster",
        caption: "Lettering concept for deepfried freinds by Anna Kulachek.",
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/40906354/file/original-e7d62c838597ba85af20072f2e7ac495.webp?resize=1504x576&vertical=center",
        alt: "Made with Love lettering detail",
        caption: "Close-up of the finalized 'Made with Love' lettering.",
      },
      {
        type: "text",
        content: `
Overall, I’m thrilled with how this piece turned out and hope that it spread love on Valentine’s Day for my client’s followers.`,
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/40906360/file/original-1c0f9cab7f9f2321779d44e30e3d7caf.mp4",
        caption: "Final animation of the 'Made with Love' post.",
        loop: true,
      },
    ],
  },
  aj: {
    slug: "aj",
    title: "It's Game On for a Sports Marketing Firm's Branding",
    tagLine:
      "Designing the Logo, Custom Animations, and Website for a Sports Marketing Firm",
    palette: { bg: "#F0F0F0", ink: "#202020" }, // Placeholder
    hero: {
      video: null, // No single hero video provided
      alt: "AJ Integrated Branding Concept", // Placeholder
    },
    sections: [
      {
        type: "text",
        content: `Client was looking for a professional logo and custom website to showcase their expertise in brand partnerships, highlighting past successes, core services, and case studies. They wanted something more engaging and compelling than standard templated websites, with a playful aspect inspired by their six-year-old daughter.`,
      },
      {
        type: "text",
        content: `
Here is a link to a blank style guide I've made based on my work with clients: https://docs.google.com/presentation/d/16oks3qcIFuduKPTuQJI1LElEfQ09EM8Nuky3Hy2djyE/edit. It helps get the ball rolling in the first meeting by visualizing the possibilities of the creative direction. I also get organized, making a folder and a Pinterest board for the client. `,
      },
      {
        type: "text",
        content: `
Once a mood board was put together, I began searching for logo inspiration. I came across this logo on Pinterest:`,
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/41028161/file/original-187a0aba41ada49523ce53758fcd8576.png?resize=1504x900&vertical=center",
        alt: "Source of inspiration for AJ Integrated logo",
        caption:
          "The logo above was the source of inspiration for my client's logo.",
      },
      {
        type: "text",
        content: `Ultimately, I decided to merge the inspiration with a 'J' and asked a designer I work with to perfect it. I wanted to make the branding more playful and pulled up a website I had archived that used Matter.js in a clever manner. Given the business is about sports, I found suitable balls that could interact with the logo.`,
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/41028162/file/original-067928c75a7d3d6b4685559265e1fbe6.mp4",
        caption: "Matter.js animation interacting with the AJ Integrated logo.",
        loop: true,
      },
      {
        type: "text",
        content: `
The split text in the hero section creates a sharp, dynamic feel. The background animation adds depth. The callouts were positioned strategically. Every detail contributes to the flow, making the design feel intentional and connected.`,
      },
      {
        type: "video",
        src: "https://cdn.dribbble.com/userupload/41514812/file/original-18db272623106a8f737356f7596fe2d3.mp4",
        caption: "Demo of the website's dynamic hero section and split text.",
        loop: true,
      },
      {
        type: "text",
        content: `
This project was about more than building a website. It was about crafting an experience. The physics-based animations and bold branding reinforce the idea of momentum.`,
      },
    ],
  },
  checkerboard3d: {
    slug: "checkerboard3d",
    title: "Checkerboard in Motion and 3D",
    tagLine: "Made another color version of this featured on CodePen",
    tagLink: {
      label: "here",
      href: "https://codepen.io/hollandblumer/pen/ZYQoBVe",
    },
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" },
    hero: {
      type: "instagram",
      embed: "https://www.instagram.com/p/DQM3z9TDzv5/",
      alt: "3D checkerboard animation moving to music",
    },

    sections: [
      {
        type: "text",
        content: `**Concept**  
This began as a quick hero experiment for a private equity client with a square logo. I wanted to explore something in 3D and tested a range of square-based motions as potential directions.`,
      },
      {
        type: "text",
        content: `**Exploration**  
I originally planned to color each block individually, and even explored variations inspired by the logo itself. But the default checkered texture that came with Three.js held the composition together better than anything I designed on top of it, so I kept it.`,
      },
      {
        type: "text",
        content: `**Refinement**  
From there, I adjusted timing, speed, depth, and lighting so the motion felt slower and more intentional. I chose a warm, fall-inspired palette for my personal version and paired it with a St. Germain track so the grid felt like it moved with the music`,
      },
      {
        type: "video",
        src: "https://assets.codepen.io/9259849/5cc44ca4-52f5-4d90-98a1-0d993bc4b837.mp4",
        caption: "Final animation of the 3D checkerboard.",
        loop: true,
      },
    ],
  },

  ccnycposter: {
    slug: "ccnycposter",
    title: "Creative Coding NYC Poster",
    tagLine:
      "Animated typography where each letter emerges from smaller copies of itself, moving in waves with a soft glow. You can view the event",
    tagLink: {
      label: "here",
      href: "https://partiful.com/e/zaMIwOD0uSo4zEXIKgkn",
    },
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" }, // Placeholder for dark background with glowing text
    hero: {
      video: "https://hollandblumer.github.io/portfolio_videos/cc.mp4", // This is based on the Work.jsx data
      alt: "Creative Coding NYC Animated Poster Demo",
    },
    sections: [
      {
        type: "video",
        src: "https://hollandblumer.github.io/portfolio_videos/cc.mp4",
        caption: "Creative Coding NYC animated poster.",
        loop: true,
      },
      {
        type: "text",
        content: `Enjoyed making this poster for Creative Coding NYC. Lately, I’ve been exploring how timing and motion can make shapes appear through perception.`,
      },
      {
        type: "text",
        content: `Here, each letter is built from smaller copies of itself that move in a wave pattern, with an outward glow effect. The motion helps the event details come through without needing to sit perfectly still.`,
      },
      {
        type: "text",
        content: `Excited to keep pushing this concept and share it with the CCNYC community.`,
      },
    ],
  },

  floatinglibrary: {
    slug: "floatinglibrary",
    title: "Floating Library for Steven Shorkey",
    tagLine:
      "A Three.js hero concept designed for an author looking beyond traditional book websites. It was also featured on CodePen",
    tagLink: {
      label: "here",
      href: "https://codepen.io/hollandblumer/pen/ZYQoBVe",
    },
    palette: { bg: "#e4eeefff", ink: "#101010ff" },
    hero: {
      video:
        "https://hollandblumer.github.io/portfolio_videos/floatinglibrary.mp4",
      alt: "Floating Library Three.js hero animation for Steven Shorkey",
    },
    sections: [
      {
        type: "video",
        src: "https://hollandblumer.github.io/portfolio_videos/floatinglibrary.mp4",
        caption:
          "Floating Library hero animation designed for author Steven Shorkey",
        loop: true,
      },
      {
        type: "text",
        content: `**Concept**  
Steven Shorkey, an author and writer, came to me after seeing Meredith Norvell’s website. He was drawn to the motion and custom details and wanted that same sense of intention for his own site. He was clear from the start that he didn’t want something conventional. He’s outdoorsy, drawn to greens and blues, and deeply interested in new technology. The goal was an author website that felt current and forward-thinking.
That direction was clear immediately. I wanted the hero to feel dimensional, setting the tone for the rest of the site. It was also an opportunity to explore Three.js in a way that felt purposeful rather than purely visual. I started with the idea of a library, explored multiple directions, from 2D books forming an S to words falling in Matter.js, before landing on this floating library approach.`,
      },
      {
        type: "text",
        content: `**Execution**  
The books are designed to drift slowly and close together, rotating just enough to create depth. The palette leans into cool greens and blues to reflect Steven’s interest in the outdoors, while simple lighting keeps the scene natural. I added text that shifts in color as books overlap, reinforcing depth and interaction.`,
      },
      {
        type: "text",
        content: `**Outcome**  
This project focused on using Three.js in a way that could realistically live on an author website. Every decision, from camera framing to motion speed, supported that goal. The site has not yet launched, as Steven is currently finalizing the written content he plans to publish. After sharing the project on CodePen, it was featured and received over 100 likes, reinforcing interest in subtle, spatial interactions on the web.`,
      },
    ],
  },
  uvsense: {
    slug: "uvsense",
    title: "Antenna Design for the World's Smallest UV Sensor",
    tagLine:
      "Building a microscopic wearable that monitors UV exposure and syncs to smartphones.",
    tagLink: {
      label: "Read Article",
      href: "https://news.northwestern.edu/stories/2018/december/worlds-smallest-wearable-device-warns-of-uv-exposure-enables-precision-phototherapy",
    },
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" },

    sections: [
      {
        type: "image",
        src: "https://assets.codepen.io/9259849/uv%20sense.png",
        alt: "UV Sense lab and device assembly",
        caption:
          "Built on a tight deadline, we produced 300 UV-monitoring wearables for L’Oréal and I contributed across PCB design, assembly, and firmware, plus an antenna redesign to shrink the device further.", // :contentReference[oaicite:0]{index=0}
      },
    ],
  },
  chargepoint: {
    slug: "chargepoint",
    title: "Automated Quality Assurance System for ChargePoint",
    tagLine:
      "A React + AWS dashboard that automated defect detection and real-time QA analytics for EV charger manufacturing.",
    palette: { bg: "#FCFCFC", ink: "#141618" },
    hero: {
      video: null,
      alt: "ChargePoint quality assurance dashboard and cloud infrastructure",
    },
    sections: [
      // Intro should come first
      {
        type: "text",
        content: `As part of ENGG 199 - Special Topics in Engineering Sciences, I worked on a full-stack development project focused on improving manufacturing quality assurance for ChargePoint. This course provided an opportunity to apply software development, cloud infrastructure, and computer vision techniques in a real-world setting. The goal was to automate defect detection for EV chargers using a React-based dashboard and AWS services.`,
      },

      // Problem
      {
        type: "text",
        content: `**Problem**
Manufacturing high-quality EV chargers requires rigorous quality control, but the existing process relied heavily on manual inspections, leading to delays, incomplete data, and inefficiencies. ChargePoint needed an automated system to capture defect data in real time, reduce inspection time per unit, and improve traceability for defect analysis.`,
      },

      // Solution
      {
        type: "text",
        content: `**Solution**
I built a React-powered dashboard that integrates computer vision, cloud computing, and real-time analytics to monitor key production metrics, including first pass yield, retest and rework rates, final yield, cycle time, and takt time. The dashboard allows users to search and filter quality control data by serial number, factory location, and pass or fail status, providing engineers with instant access to critical insights.`,
      },

      // Images (below solution)
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/41491172/file/original-8f10aad278ebf69990949bc646b948a4.png?resize=2048x1217&vertical=center",
        alt: "ChargePoint QA dashboard screenshot",
        caption:
          "Screenshot of the dashboard I developed and presented for ChargePoint. Built with React, AWS Amplify, and GraphQL to automate quality assurance and defect tracking before the rise of GenAI.",
      },
      {
        type: "image",
        src: "https://cdn.dribbble.com/userupload/41491171/file/original-c9980180dca46e3e7448f6690554d6f8.png?resize=1504x923&vertical=center",
        alt: "Recent capture data and charger detail view",
        caption:
          "Recent capture data and detailed charger view from the dashboard I built for ChargePoint.",
      },

      // Cloud / backend
      {
        type: "text",
        content: `**Cloud Infrastructure and Backend**
Originally, the project was set up with MongoDB, but I transitioned to AWS Amplify and Cognito for a scalable authentication and data management system. Rather than building a traditional backend with custom server logic, I leveraged AWS’s managed services to handle authentication, database interactions, and API management. I configured AWS AppSync for efficient GraphQL querying and implemented AWS S3 for secure storage and retrieval of inspection images. This cloud-based setup ensured real-time data accessibility and automation while minimizing the need for direct backend maintenance.

To automate quality checks, the system captured barcode and component images, analyzing them with SIFT and other image processing algorithms in Python. This enabled automated defect detection, reducing the need for manual inspection and improving error traceability.`,
      },

      // Error tracking
      {
        type: "text",
        content: `**Error Tracking and Visualization**
I developed an interactive dashboard that categorized and visualized manufacturing defects. Using Recharts.js, I built bar charts for error frequency analysis, helping engineers identify recurring issues. Additionally, I implemented moment.js to calculate time-based metrics such as units per hour and cycle time, providing deeper insights into production efficiency.`,
      },

      // Stats + metrics
      {
        type: "text",
        content: `**Statistical Analysis and Performance Metrics**
The dashboard calculated first pass yield as the ratio of chargers that passed inspection on the first attempt to the total number of chargers produced. This was updated in real time and displayed as a percentage.

The retest rate was determined by the proportion of chargers flagged for rework after failing the initial inspection. The system also calculated final yield, which measured the percentage of chargers that ultimately passed inspection, including those that required rework.

Cycle time was computed by measuring the time difference between the first recorded inspection of the day and the last, divided by the number of chargers processed. The system also estimated units per hour using timestamp data from inspection logs, calculating the rate at which chargers were passing through quality control.`,
      },

      {
        type: "text",
        content: `**Impact**
This project merged hardware, software, and cloud technologies, improving production efficiency, defect traceability, and real-time quality monitoring. By automating quality control processes, the system reduced inspection time per unit and provided engineers with actionable insights to improve manufacturing performance.

Due to NDA, I can discuss technical details upon request.`,
      },
    ],
  },
  larq: {
    slug: "larq",
    title: "Filter Lifespan Detection & Sensor Prototyping for LARQ",
    tagLine:
      "Designing and validating a capacitance-based system to track water filter lifespan.",
    palette: { bg: "#FFFFFF", ink: "#111314" },
    hero: {
      video: null,
      alt: "LARQ water filter prototyping and sensor experimentation",
    },
    sections: [
      {
        type: "text",
        content: `**Problem**
LARQ needed a reliable way to track water filter lifespan and prompt users to reorder at the right time. The challenge was that capacitance sensor data is noisy and highly sensitive to physical factors like flow rate, vessel geometry, and how users pour water. The system needed to work consistently across these variables, not just under ideal conditions.`,
      },

      {
        type: "text",
        content: `**Solution**
I was sent a physical prototype and assembled a multi-sensor setup using capacitance sensors placed at different heights. I designed experiments where I controlled drain rate and observed how sensor signals changed as water levels dropped. This helped me understand which signals were stable, where false positives occurred, and how detection thresholds needed to be tuned.`,
      },

      {
        type: "text",
        content: `**Experimental Setup**
To simulate different real-world behaviors, I partially covered the drain hole to control flow rate. I ran tests at multiple drain speeds, from fast to very slow, and recorded readings from the top, middle, and bottom sensors. I focused primarily on the middle sensor as a reference point and compared how signals shifted across repeated drain cycles.`,
      },

      {
        type: "text",
        content: `**Analysis & Algorithm Development**
As drain rates slowed, the sensor signals became more spread out and less predictable. Faster drains produced tighter, more consistent peaks. In some cases, the bottom sensor registered changes faster than the top sensor due to the internal geometry of the pitcher and the charcoal filter material.

Using Python and Excel, I analyzed these patterns, identified outliers, and refined detection thresholds so the algorithm could reliably infer filter usage over time. This work directly informed the logic used to track filter lifespan and trigger reorder reminders.`,
      },

      {
        type: "text",
        content: `**Edge Cases & Failure Modes**
I uncovered several failure cases during testing. Pouring water out too quickly could spike the signal and falsely trigger events. Hardware issues, like a broken sensor wire, made it clear where redundancy and better validation checks were needed.

These edge cases shaped how conservative the final detection logic needed to be and helped prevent false alerts in the user-facing app.`,
      },

      {
        type: "image",
        src: "https://assets.codepen.io/9259849/Screenshot%202026-01-20%20at%202.11.11%E2%80%AFPM.png",
        alt: "Capacitance sensor drain rate experiment data",
        caption: "Early Pitcher Prototype",
      },

      {
        type: "image",
        src: "https://assets.codepen.io/9259849/Screenshot%202026-01-19%20at%2012.22.50%E2%80%AFPM.png",
        alt: "LARQ team",
        caption: "End-of-summer wrap-up with the LARQ team in 2019",
      },

      {
        type: "text",
        content: `**Impact**
This work directly contributed to an algorithm that tracks filter lifespan and prompts users to reorder at the right time. The logic was integrated into the LARQ mobile app, helping translate noisy physical sensor data into a reliable, consumer-facing feature.`,
      },
    ],
  },
  abstractolives: {
    slug: "abstractolives",
    title: "Design with a Splash of Code",
    tagLine:
      "Featured on the p5.js Instagram Stories, CodePen, and in a LinkedIn article by Álvaro Montoro",
    tagLink: {
      label: "here",
      href: "https://www.linkedin.com/pulse/10-cool-codepen-demos-december-2025-%C3%A1lvaro-montoro-taude/?trackingId=4YyH6XVWtUS6nx2e7boODw%3D%3D",
    },
    palette: { bg: "#f4f4f4ff", ink: "#131414ff" },
    hero: {
      type: "instagram",
      embed: "https://www.instagram.com/p/DRydoI9jWon/",
      alt: "Abstract Olives Instagram post",
    },
    sections: [
      {
        type: "text",
        content: `**Concept**  
This generative art project began as an exploration of circles within circles. While playing with the forms, I landed on a color palette that felt reminiscent of olives, which became the visual anchor for the piece.
From there, the idea shifted toward creating a calm, design-led composition. I was inspired by Okazz and Andor Saga on OpenProcessing, especially their use of centrally clustered forms.`,
      },
      {
        type: "text",
        content: `**Execution**  
I introduced subtle motion using p5.js to bring variation and life into the composition, keeping the movement slow and controlled so the shapes and color relationships stayed front and center.`,
      },
      {
        type: "text",
        content: `**Outcome**  
The project was featured on the official p5.js Instagram account through their Instagram stories and was later selected by CodePen and shared in a LinkedIn article reflecting on the intersection of visual design and creative coding.`,
      },
    ],
  },
  "3dslicescountdown": {
    slug: "3dslicescountdown",
    title: "3D Slices Countdown with Three.js",
    tagLine:
      "A 3D countdown revealed through sliced ribbons and a subtle contour line",
    palette: { bg: "#f4f3ef", ink: "#131414ff" },
    hero: {
      type: "instagram",
      embed: "https://www.instagram.com/p/DS8IsIOESqk/",
      alt: "3D Slices Countdown Instagram post",
    },

    sections: [
      {
        type: "text",
        content: ` **Inspiration**
        This project started from a photo posted by Kelly Wearstler. I was drawn to the way the surface feels carved and rhythmic, like soft folds or woven ribbons. I wanted to translate that same energy into motion typography, but in 3D.
`,
      },
      {
        type: "image",
        src: "https://assets.codepen.io/9259849/1DB0E0DF-C076-486C-BF09-55FBB19D6B08_1_105_c.jpeg",
        alt: "Photo posted by Kelly Wearstler",
        caption: "Photo Posted by Kelly Wearstler that inspired this project",
      },
      {
        type: "text",
        content: `**Execution**
The piece is built with Three.js. The number is not a single mesh. It is formed by a stack of thin vertical ribbons. Each ribbon samples a blurred digit field and pushes forward by row, so the face of the number emerges as a sculpted relief. The movement snaps into place slowly, with a stagger across ribbons so it feels alive instead of mechanical. I originally planned to add more explicit contour lines, almost like topographic bands running through the form. In the end I kept it quieter. The subtle contour halo around the edge gave the number enough definition while letting the surface and depth do the talking`,
      },
    ],
  },
};

export default projectData;
