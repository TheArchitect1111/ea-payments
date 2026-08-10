import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { VideoProject, VideoScene } from '../../lib/video-factory/schema';
import { sceneDurationInFrames } from '../../lib/video-factory/schema';
import { ChartScene } from './components/ChartScene';
import { SceneFrame } from './components/SceneFrame';
import { SourceCitation } from './components/SourceCitation';
import { GOLD, MUTED, WHITE } from './palette';

export type EaEpisodeProps = { project: VideoProject };
function narrationAsset(projectId:string, sceneId:string){ return `video-factory/audio/${projectId}/${sceneId}.mp3`; }
function BrandBug(){ return <div style={{position:'absolute',right:80,top:54,display:'flex',alignItems:'center',gap:12,zIndex:8}}><div style={{width:7,height:7,borderRadius:99,background:GOLD}}/><div style={{color:'rgba(247,244,238,.8)',letterSpacing:3,textTransform:'uppercase',fontSize:15,fontWeight:700}}>The Money Behind It</div></div>; }
function Eyebrow({children}:{children?:string}){ return children ? <div style={{color:GOLD,letterSpacing:4,textTransform:'uppercase',fontSize:20,fontWeight:800,marginBottom:22}}>{children}</div> : null; }
function Headline({children,size=76}:{children?:string,size?:number}){ return <div style={{fontFamily:'Georgia, Times New Roman, serif',fontSize:size,lineHeight:1.02,fontWeight:700,color:WHITE,letterSpacing:-2}}>{children}</div>; }
function CinematicImage({scene}:{scene:VideoScene}){
 const frame=useCurrentFrame(); const zoom=interpolate(frame,[0,360],[1.02,1.12],{extrapolateRight:'clamp'}); const reveal=interpolate(frame,[0,18],[0,1],{extrapolateRight:'clamp'});
 return <AbsoluteFill>
   <Img src={scene.mediaUrl!} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom})`}}/>
   <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(4,9,18,.94) 0%,rgba(4,9,18,.78) 40%,rgba(4,9,18,.24) 72%,rgba(4,9,18,.10) 100%)'}}/>
   <AbsoluteFill style={{background:'linear-gradient(0deg,rgba(4,9,18,.72) 0%,transparent 42%)'}}/>
   <div style={{position:'absolute',left:110,top:0,bottom:0,width:900,display:'flex',flexDirection:'column',justifyContent:'center',opacity:reveal,transform:`translateY(${(1-reveal)*34}px)`}}>
    <Eyebrow>{scene.kicker}</Eyebrow><Headline size={82}>{scene.headline}</Headline><div style={{marginTop:28,color:'rgba(247,244,238,.84)',fontSize:30,lineHeight:1.4,maxWidth:820}}>{scene.body}</div>
   </div>
 </AbsoluteFill>;
}
function SceneBody({scene}:{scene:VideoScene}){
 const frame=useCurrentFrame();
 if(scene.type==='image'&&scene.mediaUrl) return <CinematicImage scene={scene}/>;
 if(scene.type==='title') return <div style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}><Eyebrow>{scene.kicker}</Eyebrow><Headline size={104}>{scene.headline}</Headline><div style={{marginTop:32,fontSize:40,color:MUTED}}>{scene.body}</div></div>;
 if(scene.type==='quote') return <div style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:1450}}><Eyebrow>{scene.kicker}</Eyebrow><div style={{fontFamily:'Georgia, Times New Roman, serif',fontSize:88,lineHeight:1.1,color:WHITE,fontWeight:700}}>“{scene.body||scene.headline}”</div><div style={{marginTop:34,color:GOLD,letterSpacing:3,textTransform:'uppercase',fontSize:20,fontWeight:800}}>{scene.quoteAttribution}</div></div>;
 if(scene.type==='stat'){ const scale=interpolate(frame,[0,16],[.86,1],{extrapolateRight:'clamp'}); return <div style={{height:'100%',display:'grid',gridTemplateColumns:'.72fr 1.28fr',gap:64,alignItems:'center'}}><div><Eyebrow>{scene.kicker}</Eyebrow><Headline size={54}>{scene.headline}</Headline></div><div style={{borderLeft:'1px solid rgba(201,168,68,.35)',paddingLeft:72}}><div style={{fontFamily:'Georgia, Times New Roman, serif',fontSize:82,lineHeight:1.03,color:GOLD,fontWeight:700,transform:`scale(${scale})`,transformOrigin:'left center'}}>{scene.statValue}</div><div style={{marginTop:28,fontSize:30,lineHeight:1.35,color:MUTED}}>{scene.statLabel}</div></div></div>; }
 if(scene.type==='chart') return <div style={{height:'100%',display:'grid',gridTemplateColumns:'.8fr 1.2fr',gap:64,alignItems:'center'}}><div><Eyebrow>{scene.kicker}</Eyebrow><Headline size={66}>{scene.headline}</Headline><div style={{fontSize:28,lineHeight:1.45,color:MUTED,marginTop:28}}>{scene.body}</div></div><div style={{background:'rgba(8,14,28,.38)',border:'1px solid rgba(255,255,255,.08)',borderRadius:28,padding:'36px 38px 28px'}}><ChartScene chart={scene.chart}/></div></div>;
 if(scene.type==='citation') return <div style={{height:'100%',display:'grid',gridTemplateColumns:'.72fr 1.28fr',gap:68,alignItems:'center'}}><div><Eyebrow>{scene.kicker}</Eyebrow><Headline size={64}>{scene.headline}</Headline></div><div style={{background:'rgba(8,14,28,.34)',borderRadius:26,border:'1px solid rgba(255,255,255,.08)',padding:30}}><SourceCitation citations={scene.citations}/></div></div>;
 if(scene.type==='outro') return <div style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:1440}}><Eyebrow>{scene.kicker}</Eyebrow><Headline size={86}>{scene.headline}</Headline><div style={{fontSize:32,lineHeight:1.45,color:MUTED,maxWidth:1080,marginTop:32}}>{scene.body}</div><div style={{display:'flex',gap:18,marginTop:46,alignItems:'center'}}><div style={{padding:'14px 22px',borderRadius:999,background:GOLD,color:'#111827',textTransform:'uppercase',letterSpacing:2,fontWeight:900,fontSize:16}}>Follow the money</div><div style={{color:MUTED,fontSize:19}}>Subscribe for the next story behind the numbers.</div></div></div>;
 return <div style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}><Eyebrow>{scene.kicker}</Eyebrow><Headline>{scene.headline}</Headline><div style={{marginTop:30,color:MUTED,fontSize:31,lineHeight:1.45}}>{scene.body}</div></div>;
}
function TimedScene({projectId,scene,index,total}:{projectId:string,scene:VideoScene,index:number,total:number}){ const audio=scene.narration?.trim()?staticFile(narrationAsset(projectId,scene.id)):null; return <SceneFrame>{audio?<Audio src={audio} volume={1}/>:null}<BrandBug/><SceneBody scene={scene}/><div style={{position:'absolute',left:80,bottom:42,color:'rgba(247,244,238,.55)',fontSize:14,letterSpacing:2.2,textTransform:'uppercase',zIndex:9}}>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</div></SceneFrame>; }
function starts(project:VideoProject){const out:number[]=[];let cursor=0;for(const s of project.scenes){out.push(cursor);cursor+=sceneDurationInFrames(s,project.fps)}return out;}
export function EaEpisode({project}:EaEpisodeProps){const s=starts(project);return <AbsoluteFill style={{background:'#0d1424'}}>{project.scenes.map((scene,index)=><Sequence key={scene.id} from={s[index]??0} durationInFrames={sceneDurationInFrames(scene,project.fps)}><TimedScene projectId={project.id} scene={scene} index={index} total={project.scenes.length}/></Sequence>)}</AbsoluteFill>;}
