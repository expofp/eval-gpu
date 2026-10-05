mod exhibition;
use bevy::{prelude::*, core_pipeline::{bloom::Bloom, tonemapping::Tonemapping}, pbr::{ExtendedMaterial, MaterialExtension, DirectionalLightShadowMap, NotShadowCaster}, render::{render_resource::*, mesh::{Indices, PrimitiveTopology}, render_asset::RenderAssetUsages}};
use wasm_bindgen::prelude::*;
#[wasm_bindgen(inline_js = "export function read(k){return window.lab?.[k] ?? 0;} export function publish(s){window.onRustFrame?.(JSON.parse(s));}")]
extern "C" { fn read(k: &str) -> f64; fn publish(s: &str); }
#[derive(Asset, AsBindGroup, Reflect, Debug, Clone)]
struct Interference { #[uniform(100)] params: Vec4 }
impl MaterialExtension for Interference { fn fragment_shader() -> ShaderRef { "shaders/interference.wgsl".into() } }
type CrystalMat = ExtendedMaterial<StandardMaterial, Interference>;
#[derive(Component)] struct Crystal { i: usize, pos: Vec3, scale: Vec3 }
#[derive(Component)] struct Dust { i: usize }
#[derive(Component)] struct Ring(f32);
#[derive(Resource, Default)] struct State { count: usize, tick:f32, elapsed:f32, click:f64, selected:i32 }
#[derive(Resource)] struct Library { mesh:Handle<Mesh>, mats:Vec<Handle<CrystalMat>>, particle:Handle<Mesh>, glow:Handle<StandardMaterial>, base_triangles:usize }
#[wasm_bindgen(start)]
pub fn start() {
 let mut app=App::new(); app.insert_resource(ClearColor(Color::srgb(0.012,0.022,0.035)))
 .insert_resource(AmbientLight { color:Color::srgb(0.42,0.65,0.8), brightness:170.0, ..default() })
 .insert_resource(DirectionalLightShadowMap { size:2048 })
 .init_resource::<State>()
 .add_plugins(DefaultPlugins.set(AssetPlugin { file_path: "./assets".into(), meta_check: bevy::asset::AssetMetaCheck::Never, ..default() }).set(WindowPlugin { primary_window:Some(Window { canvas:Some("#scene".into()), fit_canvas_to_parent:false, prevent_default_event_handling:true, ..default() }), ..default() }))
 .add_plugins(MaterialPlugin::<CrystalMat>::default());
 if read("exhibition")==1. { exhibition::install(&mut app); } else { app.add_systems(Startup, setup).add_systems(Update, update); }
 app.run();
}
fn crystal_mesh()->Mesh {
 let mut positions=Vec::new(); let mut normals=Vec::new(); let mut indices=Vec::new();
 let ring:Vec<Vec3>=(0..6).map(|i| {let a=i as f32*std::f32::consts::TAU/6.; Vec3::new(a.cos(),0.,a.sin())}).collect();
 for i in 0..6 { for (a,b,c) in [(Vec3::new(0.,1.7,0.),ring[(i+1)%6],ring[i]),(Vec3::new(0.,-1.1,0.),ring[i],ring[(i+1)%6])] {let n=(b-a).cross(c-a).normalize();for v in [a,b,c] {indices.push(positions.len() as u32);positions.push(v.to_array());normals.push(n.to_array());}} }
 let uv=vec![[0.,0.];positions.len()];
 Mesh::new(PrimitiveTopology::TriangleList,RenderAssetUsages::default()).with_inserted_attribute(Mesh::ATTRIBUTE_POSITION,positions).with_inserted_attribute(Mesh::ATTRIBUTE_NORMAL,normals).with_inserted_attribute(Mesh::ATTRIBUTE_UV_0,uv).with_inserted_indices(Indices::U32(indices))
}
fn setup(mut commands:Commands, mut meshes:ResMut<Assets<Mesh>>, mut materials:ResMut<Assets<StandardMaterial>>,mut crystals:ResMut<Assets<CrystalMat>>) {
 commands.spawn((Camera3d::default(),Camera{hdr:true,..default()},Tonemapping::TonyMcMapface,Bloom {intensity:0.22,..Bloom::NATURAL},Msaa::Off,Transform::from_xyz(18.,13.,23.).looking_at(Vec3::new(0.,2.,0.),Vec3::Y),DistanceFog { color:Color::srgb(0.015,0.028,0.045),falloff:FogFalloff::Linear{start:28.,end:100.},..default() }));
 commands.spawn((DirectionalLight{ illuminance:14000., shadows_enabled:true,..default()},Transform::from_xyz(12.,18.,8.).looking_at(Vec3::ZERO,Vec3::Y)));
 for (p,c,intensity) in [(Vec3::new(-7.,5.,3.),Color::srgb(0.05,0.8,1.),1800000.),(Vec3::new(7.,4.,-3.),Color::srgb(1.,0.16,0.05),2200000.)] {commands.spawn((PointLight {color:c,intensity,range:35.,shadows_enabled:false,..default()},Transform::from_translation(p)));}
 let dark=materials.add(StandardMaterial{base_color:Color::srgb(0.045,0.075,0.09),metallic:0.8,perceptual_roughness:0.3,..default()});
 let edge=materials.add(StandardMaterial{base_color:Color::srgb(0.15,0.23,0.25),metallic:0.9,perceptual_roughness:0.25,..default()});
 let glow=materials.add(StandardMaterial{base_color:Color::srgb(0.15,0.85,0.9),emissive:LinearRgba::rgb(0.15,5.,5.5),..default()});
 let amber=materials.add(StandardMaterial{emissive:LinearRgba::rgb(8.,1.8,0.25),..default()});
 commands.spawn((Mesh3d(meshes.add(Plane3d::default().mesh().size(240.,240.))),MeshMaterial3d(dark.clone()),Transform::from_xyz(0.,-1.05,0.)));
 for (r,h,y,m) in [(9.5,0.5,-0.75,dark.clone()),(8.9,0.16,-0.43,edge.clone()),(8.6,0.12,-0.29,dark.clone()),(3.1,0.6,0.05,edge.clone()),(2.9,0.1,0.4,dark.clone())] {commands.spawn((Mesh3d(meshes.add(Cylinder::new(r,h).mesh().resolution(96))),MeshMaterial3d(m),Transform::from_xyz(0.,y,0.)));}
 for r in [3.25,8.65,9.35] {commands.spawn((Mesh3d(meshes.add(Torus::new(r-0.018,r+0.018))),MeshMaterial3d(glow.clone()),Transform::from_xyz(0.,-0.12,0.)));}
 for i in 0..72 {let a=i as f32*std::f32::consts::TAU/72.;commands.spawn((Mesh3d(meshes.add(Cuboid::new(0.035,0.025,if i%6==0 {0.6}else{0.22}))),MeshMaterial3d(if i%6==0 {amber.clone()} else {edge.clone()}),Transform::from_xyz(a.sin()*8.1,-0.2,a.cos()*8.1).with_rotation(Quat::from_rotation_y(a))));}
 let mesh=meshes.add(crystal_mesh()); let mut mats=Vec::new();
 for i in 0..8 {let k=i as f32/7.;mats.push(crystals.add(ExtendedMaterial {base:StandardMaterial {base_color:Color::srgb(0.035+k*0.16,0.26+k*0.24,0.32+k*0.28),metallic:0.72,perceptual_roughness:0.19,reflectance:0.7,..default()},extension:Interference{params:Vec4::new(0.,k,0.,0.)}}));}
 commands.spawn((Mesh3d(mesh.clone()),MeshMaterial3d(mats[0].clone()),Transform::from_xyz(0.,4.8,0.).with_scale(Vec3::new(1.9,2.0,1.9)),Crystal{i:0,pos:Vec3::new(0.,4.8,0.),scale:Vec3::new(1.9,2.,1.9)}));
 for (i,r) in [3.5,4.1,4.7].iter().enumerate() {commands.spawn((Mesh3d(meshes.add(Torus::new(r-0.028,r+0.028))),MeshMaterial3d(if i==1 {amber.clone()}else{glow.clone()}),Transform::from_xyz(0.,4.8,0.).with_rotation(Quat::from_euler(EulerRot::XYZ,0.4+i as f32*0.6,0.,0.3)),Ring(i as f32)));}
 let particle=meshes.add(Sphere::new(0.035).mesh().ico(0).unwrap());
 for i in 0..800 {commands.spawn((Mesh3d(particle.clone()),MeshMaterial3d(if i%7==0 {amber.clone()}else{glow.clone()}),Transform::default(),Dust{i},NotShadowCaster));}
 let base_triangles=meshes.iter().filter(|(id,_)| *id != mesh.id() && *id != particle.id()).map(|(_,m)| m.indices().map(|i|i.len()).unwrap_or(m.count_vertices())/3).sum();
 commands.insert_resource(Library{mesh,mats,particle,glow,base_triangles});
}
fn update(mut commands:Commands,time:Res<Time>,mut state:ResMut<State>,lib:Res<Library>,mut crystals:Query<(Entity,&Crystal,&mut Transform,&mut Visibility)>,mut particles:Query<(&Dust,&mut Transform,&mut Visibility),Without<Crystal>>,mut rings:Query<(&Ring,&mut Transform),(Without<Crystal>,Without<Dust>)>,mut cam:Query<(&Camera,&GlobalTransform,&mut Transform),(Without<Crystal>,Without<Dust>,Without<Ring>)>,mut mats:ResMut<Assets<CrystalMat>>,mut windows:Query<&mut Window>) {
 let dt=time.delta_secs(); if read("paused")==0. {state.elapsed+=dt.min(0.05);} let t=state.elapsed;
 let level=read("complexity") as usize; let wanted=(48+level*level*3/5).min(6048);
 // Bounded allocation: no more than 96 new crystal entities per frame.
 if state.count<wanted {let end=(state.count+96).min(wanted);for i in state.count..end {let j=i+1;let a=j as f32*2.399963;let r=4.8+(j as f32*0.071).sqrt()%15.;let p=Vec3::new(a.cos()*r,0.65+(a*2.3).sin().abs()*1.3,a.sin()*r);let s=0.17+0.4*((j*73%101) as f32/100.);let scale=Vec3::new(s,s*(1.2+(a*0.7).sin().abs()),s);commands.spawn((Mesh3d(lib.mesh.clone()),MeshMaterial3d(lib.mats[j%8].clone()),Transform::from_translation(p).with_scale(scale),Crystal{i:j,pos:p,scale}));}state.count=end;}
 let mut selected_pos=None;
 for (_,c,mut tr,mut vis) in &mut crystals {*vis=if c.i<=wanted {Visibility::Visible}else{Visibility::Hidden};tr.translation=c.pos+Vec3::Y*(t*0.7+c.i as f32).sin()*if c.i==0 {0.3}else{0.17};tr.rotation=Quat::from_euler(EulerRot::XYZ,0.08*(t+c.i as f32).sin(),t*if c.i==0 {0.18}else{0.09}+c.i as f32,0.08);tr.scale=c.scale*if state.selected==c.i as i32 {1.22}else{1.};if state.selected==c.i as i32 {selected_pos=Some(tr.translation);}}
 let particle_count=(80+level*7).min(780);
 for (p,mut tr,mut v) in &mut particles {*v=if p.i<particle_count {Visibility::Visible}else{Visibility::Hidden};let a=p.i as f32*2.4+t*(0.07+(p.i%5) as f32*0.015);let r=3.+(p.i as f32*0.131)%16.;tr.translation=Vec3::new(a.cos()*r,0.7+(p.i as f32*0.73+t*0.3)%9.,a.sin()*r);}
 for (r,mut tr) in &mut rings {tr.rotation=Quat::from_euler(EulerRot::XYZ,0.55+r.0*0.55,t*(0.1+r.0*0.025),0.35+(t*0.1+r.0).sin()*0.25);}
 for (_,m) in mats.iter_mut(){m.extension.params.x=t;m.extension.params.z=read("interference") as f32;}
 let yaw=read("yaw") as f32;let pitch=read("pitch") as f32;let radius=read("radius") as f32;
 let target=Vec3::new(read("panX") as f32,2.4+read("panY") as f32,0.);
 let click=read("click"); let mut core_screen=Vec2::ZERO;
 for (camera,global,mut tr) in &mut cam { if let Ok(p)=camera.world_to_viewport(global,Vec3::new(0.,4.8+(t*0.7).sin()*0.3,0.)) { core_screen=p / camera.logical_viewport_size().unwrap_or(Vec2::ONE) * Vec2::new(read("width") as f32,read("height") as f32); }*tr=Transform::from_translation(target+Vec3::new(yaw.sin()*pitch.cos(),pitch.sin(),yaw.cos()*pitch.cos())*radius).looking_at(target,Vec3::Y);
 if click!=state.click {if let Ok(ray)=camera.viewport_to_world(global,Vec2::new(read("clickX") as f32,read("clickY") as f32) * camera.logical_viewport_size().unwrap_or(Vec2::ONE) / Vec2::new(read("width") as f32,read("height") as f32)) {let mut best=10000.;let mut pick=-1;for (_,c,tr,_) in &crystals {if c.i>wanted {continue;}let v=tr.translation-ray.origin;let along=v.dot(*ray.direction);let dist=(v-*ray.direction*along).length();if along>0. && along<best && dist<c.scale.max_element()*1.3 {best=along;pick=c.i as i32;}}state.selected=pick;}state.click=click;}}
 let scale=read("resolution") as f32;
 for mut w in &mut windows { let width=(read("width") as f32*read("dpr") as f32*scale).round().max(1.) as u32; let height=(read("height") as f32*read("dpr") as f32*scale).round().max(1.) as u32;  if w.physical_width()!=width || w.physical_height()!=height {w.resolution.set_physical_resolution(width,height);} }
 state.tick+=dt;if state.tick>0.35 {state.tick=0.;publish(&format!("{{\"crystals\":{},\"particles\":{},\"triangles\":{},\"selected\":{},\"time\":{:.2},\"coreX\":{:.2},\"coreY\":{:.2},\"ready\":true}}",state.count.min(wanted)+1,particle_count,(state.count.min(wanted)+1)*12+particle_count*20+lib.base_triangles,state.selected,t,core_screen.x,core_screen.y));}
 let _=selected_pos;let _=(&lib.particle,&lib.glow);
}
