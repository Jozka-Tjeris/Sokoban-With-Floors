import * as THREE from 'three';
import { activeAnimationList, animationDuration, teleportAnimationDuration } from '../main';

export function animatePositionOffsetToItem(item, x, y, z){
    const startPos = item.position.clone();
    const endPos = startPos.clone().add(new THREE.Vector3(x, y, z));
    const startTime = performance.now();
    const object = item;
    const duration = animationDuration;

    activeAnimationList.push({
        object,
        startTime,
        duration,
        startPos,
        endPos
    });
}

export function animateTeleportToItemExitBlock(item, initialOpacity, onComplete){
    const startPos = item.position.clone();
    const endPos = startPos.clone().add(new THREE.Vector3(0, 1, 0));
    const startTime = performance.now();
    const object = item;
    const duration = teleportAnimationDuration;

    let startOpacity = 1;
    if(Array.isArray(initialOpacity)){
        startOpacity = initialOpacity[0];
    }
    else{
        startOpacity = initialOpacity;
    }

    const material = object.material;
    material.transparent = true;

    object.traverse((object) => {
        object.material.depthWrite = false;
    })

    function changeOpacity(t){
        material.opacity = startOpacity - startOpacity*t;
    }
    function finalizeOpacity(){
        material.opacity = 0;
    }
    activeAnimationList.push({
        object,
        startTime,
        duration,
        startPos,
        endPos,
        onComplete,
        changeOpacity,
        finalizeOpacity
    });
}

export function animateTeleportToItemEnterBlock(item, endOpacity, onComplete){
    const startPos = item.position.clone();
    const endPos = startPos.clone().add(new THREE.Vector3(0, -1, 0))
    const startTime = performance.now();
    const object = item;
    const duration = teleportAnimationDuration;

    const material = object.material;
    material.transparent = true;

    let finalOpacity = 1;

    if(Array.isArray(endOpacity)){
        finalOpacity = endOpacity[0];
    }
    else{
        finalOpacity = endOpacity;
    }

    //needs to grab original opacity of object for this to work
    function changeOpacity(t){
        material.opacity = finalOpacity*t;
        //set depthWrite = true for when object is already halfway through the animation
        if(t >= 0.5){
            object.traverse((object) => {
                object.material.depthWrite = true;
            })
        }
    }
    function finalizeOpacity(){
        material.opacity = finalOpacity;
    }

    activeAnimationList.push({
        object,
        startTime,
        duration,
        startPos,
        endPos,
        onComplete,
        changeOpacity,
        finalizeOpacity
    });
}