import {CreativeDirection,StudioProjectType} from './design-system';

export type StudioRenderer='ea-vector-web'|'krita-composite-worker'|'inkscape-vector-worker'|'gimp-batch-worker'|'remotion-motion-worker';
export type RenderNeed={projectType:StudioProjectType;direction:CreativeDirection;needsPhotoComposite?:boolean;needsVectorPrecision?:boolean;needsBatchPhotoProcessing?:boolean;needsMotion?:boolean};

export function routeRenderers(need:RenderNeed):StudioRenderer[]{
 const workers:StudioRenderer[]=['ea-vector-web'];
 if(need.needsPhotoComposite) workers.push('krita-composite-worker');
 if(need.needsVectorPrecision||need.projectType==='event-creative') workers.push('inkscape-vector-worker');
 if(need.needsBatchPhotoProcessing) workers.push('gimp-batch-worker');
 if(need.needsMotion) workers.push('remotion-motion-worker');
 return workers;
}

export const rendererPolicy={
 visibleProduct:'Design Studio',
 defaultRenderer:'ea-vector-web' as StudioRenderer,
 rule:'Renderers are implementation details. The user chooses the outcome and Studio chooses the machinery.',
 fallbacks:{
  'krita-composite-worker':'ea-vector-web',
  'inkscape-vector-worker':'ea-vector-web',
  'gimp-batch-worker':'ea-vector-web',
  'remotion-motion-worker':'ea-vector-web',
 },
};
