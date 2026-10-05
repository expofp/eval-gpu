#import bevy_pbr::{pbr_fragment::pbr_input_from_standard_material, forward_io::{VertexOutput, FragmentOutput}, pbr_functions::{apply_pbr_lighting, main_pass_post_lighting_processing}}
struct Interference { params: vec4<f32> }
@group(2) @binding(100) var<uniform> effect: Interference;
@fragment
fn fragment(in: VertexOutput, @builtin(front_facing) front: bool) -> FragmentOutput {
 var pbr = pbr_input_from_standard_material(in, front);
 let p = in.world_position.xyz;
 let wave = sin(p.y * 9.0 - effect.params.x * 1.6 + sin(p.x*3.0+p.z*2.0)*1.2);
 let bands = pow(max(0.0, wave), 18.0);
 let facing = pow(1.0-abs(dot(normalize(pbr.N), normalize(pbr.V))), 3.0);
 let spectrum = 0.5 + 0.5*cos(vec3<f32>(0.0,2.1,4.2)+p.y*1.8+effect.params.y*4.0+effect.params.x*0.25);
 pbr.material.base_color = vec4<f32>(mix(pbr.material.base_color.rgb, spectrum*0.45, facing*0.7*effect.params.z),1.0);
 pbr.material.emissive = vec4<f32>((vec3<f32>(0.08,0.9,1.0)*bands*1.5+spectrum*facing*0.65)*effect.params.z,0.0);
 var out: FragmentOutput;
 out.color=apply_pbr_lighting(pbr);
 out.color=main_pass_post_lighting_processing(pbr,out.color);
 return out;
}
