import { Buffer } from "../dmd/Buffer.mjs";

class ScoreEffectRenderer {

    #adapter;
    #device;
    #width;
    #height;
    #shaderModule;
    #bufferByteLength;
    #counter;
    #noises;
    #startTime;
    #nbFrames;
    #speedFactor;
    renderFrame;

    /**
     * https://robson.plus/white-noise-image-generator/
     * @param {*} _width 
     * @param {*} _height 
     */

    constructor(_width, _height, images) {
        this.#device;
        this.#adapter;
        this.#shaderModule;
        this.#width = _width;
        this.#height = _height;
        this.#bufferByteLength = _width * _height * 4;
        this.#counter = 0;
        //this.#nbFrames = 10;
        //this.#speedFactor = 90;
        this.#nbFrames = images.length;
        this.#speedFactor = 50;
        this.#noises = [];
        this.#startTime = window.performance.now();
        this.renderFrame = this.#doNothing;

        if (!Array.isArray(images)) {
            throw new TypeError("An array of images filename is expected as third argument");
        }

        const that = this;

        // Fill noise array from images
        for (var i = 0 ; i < this.#nbFrames ; i++) {
            this.#loadNoise(images[i]).then( blob => {

                // Temporary buffer to draw noise image and get data array from it
                let tmpBuffer = new Buffer(this.#width, this.#height);

                let img = new Image();

                img.onload = (event) => {
                    URL.revokeObjectURL(event.target.src);

                    tmpBuffer.clear();
                    tmpBuffer.context.drawImage(event.target, 0, 0);
                    let frameData = tmpBuffer.context.getImageData(0, 0, _width, _height).data;
                    that.#noises.push(frameData);
                }

                  // Set the src of the <img> to the object URL so the image displays it
                img.src = URL.createObjectURL(blob);
            });
        }
        //console.log("Noises", this.#noises);
    }

    /**
     * Fetch image from server
     * @param {string} src 
     * @returns 
     */
    async #loadNoise(src) {
        let response = await fetch(src);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          } else {
            return await response.blob();
          }        
    }


    init() {
        const that = this;

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                that.#adapter = adapter;
            
                adapter.requestDevice().then( device => {
                    that.#device = device;

                    that.#shaderModule = device.createShaderModule({
                        code: `
                            [[block]] struct Image {
                                rgba: array<u32>;
                            };
                            [[group(0), binding(0)]] var<storage,read> noisePixels: Image;
                            [[group(0), binding(1)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(2)]] var<storage,write> outputPixels: Image;
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${that.#width}u;

                                var pixel : u32 = inputPixels.rgba[index];
                                var noise : u32 = noisePixels.rgba[index];
                                
                                let a : u32 = (pixel >> 24u) & 255u;
                                let r : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let b : u32 = (pixel & 255u);
                                //pixel = a << 24u | r << 16u | g << 8u | b;
               
                                if ( r > 200u && g > 200u && b > 200u ) {
                                //if ( pixel == 4294967295u ) {

                                    let na : u32 = (noise >> 24u) & 255u;
                                    let nr : u32 = (noise >> 16u) & 255u;
                                    let ng : u32 = (noise >> 8u) & 255u;
                                    let nb : u32 = (noise & 255u);
    
                                    // if finding a dark pixel on the noise buffer for this index
                                    // then alter the current pixel color (white-> blue)
                                    if ( nr < 200u && ng < 200u && nb < 200u) {
                                        pixel = pixel - 10100u;
                                    }
                                }

                                outputPixels.rgba[index] = pixel;
                                //outputPixels.rgba[index] = noise;
                            }
                        `
                    });

                    console.log('ScoreEffectRenderer:init()');

                    this.#shaderModule.compilationInfo().then(i => {
                        if (i.messages.length > 0 ) {
                            console.warn("ScoreEffectRenderer:compilationInfo() ", i.messages);
                        }
                    });

                    that.renderFrame = that.#doRendering;
                    resolve();
                });    
            });
       });
    
    }

    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {ImageData} frameData
     * @returns {ImageData}
     */
    #doNothing(frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(resolve =>{
            resolve(frameData);
        });        
    }

    /**
     * Apply filter to provided ImageData object then return altered data
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    #doRendering(frameData) {
        const that = this;

        const gpuNoiseBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });

        const gpuInputBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
    
        const gpuTempBuffer = this.#device.createBuffer({
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
    
        const gpuOutputBuffer = this.#device.createBuffer({
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
    
        const bindGroupLayout = this.#device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer : {
                        type: "read-only-storage"
                    }
                },            
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                }
            ]
        });
    
        const bindGroup = this.#device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuNoiseBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                }
            ]
        });

        //console.log(this.#shaderModule);
    
        const computePipeline =this.#device.createComputePipeline({
            layout: this.#device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this.#shaderModule,
                entryPoint: "main"
            }
        });        

        return new Promise( resolve => {

            const frame = Math.floor(this.#counter % this.#nbFrames);

            new Uint8Array(gpuNoiseBuffer.getMappedRange()).set(new Uint8Array(this.#noises[frame]));
            gpuNoiseBuffer.unmap();
            
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData));
            gpuInputBuffer.unmap();
    
            const commandEncoder = that.#device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();

            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatch(that.#width, that.#height);
            passEncoder.endPass();

            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that.#bufferByteLength);
    
            that.#device.queue.submit([commandEncoder.finish()]);
    
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
                //that.#counter = that.#counter + .50;

                // use timestamp as 'constant' so that speed is not impacted by multiple calls of the shader
                var now = window.performance.now();
                var delta = now - that.#startTime;

                that.#counter += Math.floor(delta) / that.#speedFactor; 

                this.#startTime = now;

    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());

                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that.#width, that.#height);

                // return to caller
                resolve(imageData);
            });
        });
	}

}

export { ScoreEffectRenderer }