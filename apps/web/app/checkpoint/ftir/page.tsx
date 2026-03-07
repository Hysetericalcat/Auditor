import {Navbar, NavBrand} from "../../../../../packages/ui/src/Navbar"
import {Sidebar, SidebarUser,SidebarItem} from "../../../../../packages/ui/src/Sidebar"
import {Button} from "../../../../../packages/ui/src/Button"
import {Waves, 
    Zap, 
    Droplet, 
    Activity, 
    FileText, 
    FlaskConical} from "lucide-react"

export default function FTIR(){

    const SidebarItems :SidebarItem[] = [
        { 
          id: "ftir", 
          label: "FTIR Analysis", 
          icon: <Waves size={16} strokeWidth={1.5} />, 
          href: "/checkpoint/ftir" 
        },
        { 
          id: "uv", 
          label: "UV Analysis", 
          icon: <Zap size={16} strokeWidth={1.5} />, 
          href: "/checkpoint/uv" 
        },
        { 
          id: "kft", 
          label: "KFT (Moisture)", 
          icon: <Droplet size={16} strokeWidth={1.5} />, 
          href: "/checkpoint/kft" 
        },
        { 
          id: "eventhistory", 
          label: "Event History", 
          icon: <Activity size={16} strokeWidth={1.5} />, 
          href: "/checkpoint/eventhistory" 
        },
        { 
          id: "reporthistory", 
          label: "Report History", 
          icon: <FileText size={16} strokeWidth={1.5} />, 
          href: "/checkpoint/reporthistory" 
        }
      ]
    
    return(<div className="">
        <Navbar
        variant="default"
        size="md"
        position="sticky"
        bordered
        dimensions={{ maxWidth: 1500, paddingX: 30 }}
        brand={<NavBrand name="PharmaCore" tag="QMS Platform" icon="Φ" size="md" />}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" size="sm">Sign Out</Button>
          </div>
        }
      />
      <Sidebar
      items = {SidebarItems}
      variant = "default"
      position = "left"
      />
    </div>)
}