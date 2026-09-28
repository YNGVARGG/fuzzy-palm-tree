import { LandingExperience } from "@/components/landing/experience"
export default function LandingPage(){
  const appUrl=process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV==="development"?"http://127.0.0.1:3001/login":null)
  const raw=process.env.NEXT_PUBLIC_DEMO_URL || "https://cal.com/yonathan-henok-bjumzf/demo"
  let demoUrl:string|null=null
  if(raw){try{const url=new URL(raw);if(url.protocol==="https:" && url.hostname==="cal.com" && url.pathname.split("/").filter(Boolean).length>=2 && !url.username && !url.password)demoUrl=url.toString()}catch{}}
  return <LandingExperience appUrl={appUrl} demoUrl={demoUrl}/>
}

