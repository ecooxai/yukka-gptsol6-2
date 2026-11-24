import {group} from './geometry.js';
import {materials} from './materials.js';
import {createBody} from './body.js';
import {createHead} from './head.js';
export function createCharacter(scene){
 const model=group(scene,'YUUKA • GPT-6.2 • original procedural sculpture');
 const M=materials();createBody(model,M);createHead(model,M);return model;
}
