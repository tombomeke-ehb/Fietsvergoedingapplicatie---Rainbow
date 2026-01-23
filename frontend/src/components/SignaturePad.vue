// Eenvoudige signature pad component (canvas)
<template>
  <div class="signature-pad">
    <canvas ref="canvas" :width="width" :height="height" @mousedown="start" @mousemove="move" @mouseup="end" @mouseleave="end"
            @touchstart.prevent="startTouch" @touchmove.prevent="moveTouch" @touchend.prevent="end" style="border:1px solid #ccc; background:white; border-radius:4px; cursor:crosshair;"/>
    <div class="sig-actions">
      <button type="button" @click="clear">Wissen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const props = defineProps({ width: { type: Number, default: 300 }, height: { type: Number, default: 100 } });
const emit = defineEmits(['update:modelValue']);
const canvas = ref(null);
let drawing = false;
let last = { x: 0, y: 0 };

function getPos(e) {
  const rect = canvas.value.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function start(e) {
  drawing = true;
  last = getPos(e);
}
function move(e) {
  if (!drawing) return;
  const ctx = canvas.value.getContext('2d');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#222';
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  last = pos;
  emitImage();
}
function end() {
  drawing = false;
  emitImage();
}
function clear() {
  const ctx = canvas.value.getContext('2d');
  ctx.clearRect(0, 0, props.width, props.height);
  emitImage();
}
function emitImage() {
  emit('update:modelValue', canvas.value.toDataURL('image/png'));
}
// Touch events
function startTouch(e) { start(e); }
function moveTouch(e) { move(e); }

onMounted(clear);
</script>

<style scoped>
.signature-pad { display: flex; flex-direction: column; align-items: flex-start; }
.sig-actions { margin-top: 0.5rem; }
canvas { touch-action: none; }
</style>
