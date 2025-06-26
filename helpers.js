import * as THREE from 'three';

export function addPositionToItem(item, x, y, z){
    item.position.x += x;
    item.position.y += y;
    item.position.z += z;
}

export function setPositionToItem(item, x, y, z){
    item.position.x = x;
    item.position.y = y;
    item.position.z = z;
}

export function QRotateDegreesObject3DAxis(item, axis, angle){
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, THREE.MathUtils.degToRad(angle));
    item.applyQuaternion(quaternion);
}
