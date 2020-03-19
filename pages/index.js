
import * as canvas from 'canvas';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import axios from 'axios'
const Index = () => {
    async function Webcam() {

        const video = document.getElementById('video')
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/static/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/static/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/static/models'),
            await faceapi.loadSsdMobilenetv1Model('/static/models')

        ]).then(startVideo)

        function startVideo() {
            navigator.getUserMedia(
                { video: {} },
                stream => video.srcObject = stream,
                err => console.error(err)
            )
        }

        video.addEventListener('play', () => {
            const canvas = faceapi.createCanvasFromMedia(video)
            document.body.append(canvas)
            const displaySize = { width: video.width, height: video.height }
            faceapi.matchDimensions(canvas, displaySize)

            setInterval(async () => {
                canvas.getContext('2d').clearRect(0, 0, 300, 300)
                let fullFaceDescriptions = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
                fullFaceDescriptions = faceapi.resizeResults(fullFaceDescriptions)
                faceapi.draw.drawDetections(canvas, fullFaceDescriptions)
                faceapi.draw.drawLandmarks(canvas, fullFaceDescriptions)
                const labels = ['sheldon', 'raj', 'leonard', 'howard']
                const labeledFaceDescriptors = await Promise.all(
                    labels.map(async label => {
                        // fetch image data from urls and convert blob to HTMLImage element
                        const imgUrl = `${label}.png`
                        const img = await faceapi.fetchImage(imgUrl)

                        // detect the face with the highest score in the image and compute it's landmarks and face descriptor
                        const fullFaceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()

                        if (!fullFaceDescription) {
                            throw new Error(`no faces detected for ${label}`)
                        }

                        const faceDescriptors = [fullFaceDescription.descriptor]
                        return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
                    })
                )
                const maxDescriptorDistance = 0.6
                const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance)
                const results = fullFaceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor))
                results.forEach((bestMatch, i) => {
                    const box = fullFaceDescriptions[i].detection.box
                    const text = bestMatch.toString()
                    const drawBox = new faceapi.draw.DrawBox(box, { label: text })
                    drawBox.draw(canvas)
                })
                //const resizedDetections = faceapi.resizeResults(detections, displaySize)
                //canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
                // faceapi.draw.drawDetections(canvas, resizedDetections)
                // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
                // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
            }, 100)
        })
    }
    return (
        <div>
            <button onClick={Webcam}>Camera</button>
            <video id="video" height="300" width="300" autoPlay muted></video>
        </div>
    )
}
export default Index;


// const imageUpload = document.getElementById('imageUpload')

// Promise.all([
//   faceapi.nets.faceRecognitionNet.loadFromUri('/static/models'),
//   faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
//   faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
// ]).then(start)

// async function start() {
//   const container = document.createElement('div')
//   container.style.position = 'relative'
//   document.body.append(container)
//   const labeledFaceDescriptors = await loadLabeledImages()
//   const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
//   let image
//   let canvas
//   document.body.append('Loaded')
//   imageUpload.addEventListener('change', async () => {
//     if (image) image.remove()
//     if (canvas) canvas.remove()
//     image = await faceapi.bufferToImage(imageUpload.files[0])
//     container.append(image)
//     canvas = faceapi.createCanvasFromMedia(image)
//     container.append(canvas)
//     const displaySize = { width: image.width, height: image.height }
//     faceapi.matchDimensions(canvas, displaySize)
//     const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
//     const resizedDetections = faceapi.resizeResults(detections, displaySize)
//     const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
//     results.forEach((result, i) => {
//       const box = resizedDetections[i].detection.box
//       const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
//       drawBox.draw(canvas)
//     })
//   })
// }

// function loadLabeledImages() {
//   const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
//   return Promise.all(
//     labels.map(async label => {
//       const descriptions = []
//       for (let i = 1; i <= 2; i++) {
//         const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
//         const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
//         descriptions.push(detections.descriptor)
//       }

//       return new faceapi.LabeledFaceDescriptors(label, descriptions)
//     })
//   )
// }