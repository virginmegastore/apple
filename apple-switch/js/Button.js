// let video = document.querySelector('video');
// let isPaused = false; /* flag for auto-pausing of the video */
// let observer = new IntersectionObserver((entries, observer) => { 
//   entries.forEach(entry => {
//     if(entry.intersectionRatio!=1  && !video.paused){
//       video.pause(); isPaused = true;
//     }
//     else if(isPaused) {video.play(); isPaused=false}

//   });
// }, {threshold: 1});
// observer.observe(video) ;


let options = {
    threshold: 0.01,
}

var target = document.querySelector('#compare');

let isHided = false

let isAbove = false

var callback = function(entries, observer) {
    entries.forEach(entry => {
        let isIntersecting = entry.isIntersecting
        if (isIntersecting && !isHided){
            document.querySelector('#scroll-to-compare').animate([{bottom: '-200px'}],{
                duration: 1000,
                fill: 'forwards',
              })
            isHided = true
        }else if (!isIntersecting && isHided && !isAbove){ // If is above viewport the go to compare button will not show
            document.querySelector('#scroll-to-compare').animate([{bottom: '30px'}],{
                duration: 1000,
                fill: 'forwards',
              })
            isHided = false
        }
      });
};

let observador = new IntersectionObserver( callback, options);
observador.observe(target);

// Checks if compare section is above the current viewport 
window.addEventListener('scroll', () => {
    const compareSection = document.querySelector('#compare');
    const bounding = compareSection.getBoundingClientRect()
    isAbove = bounding.top < 0 ? true : false
})

document.querySelector('#scroll-to-compare').addEventListener('click',()=>{
    target.scrollIntoView({behavior:"smooth"})
})

// if(!!window.IntersectionObserver){
// 	let target = document.querySelector('#compare');
// 	let observer = new IntersectionObserver((entries, observer) => { 
//         console.log(entries)
// 		entries.forEach(entry => {
// 			// console.log(entry)
// 		});
// 	});
// 	observer.observe(target) ;
// }


// else document.querySelector('#warning').style.display = 'block';

// if(!!window.IntersectionObserver){
// 	let video = document.querySelector('#compare');
// 	let isPaused = false; /* flag for auto-pausing of the video */
// 	let observer = new IntersectionObserver((entries, observer) => { 
// 		entries.forEach(entry => {
// 			console.log(entry.intersectionRatio)
// 			if(entry.intersectionRatio!=1){
// 			    isPaused = true;
// 			}
// 			else if(isPaused) {isPaused=false}

// 		});
// 	}, {threshold: 1});
// 	observer.observe(video) ;
// }

// else document.querySelector('#warning').style.display = 'block';

// let observer = new IntersectionObserver((entries, observer) => { 
//     entries.forEach(entry => {
//         console.log(entry.intersectionRatio)

//     });
// });

// observer.observe(document.querySelector('#compare'))