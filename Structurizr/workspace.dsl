workspace "Konnaxion" "sanity check" {
  model {
    p_User = person "User"
    sys    = softwareSystem "Konnaxion" {
      c_WebApp = container "WebApp" "Frontend UI" "Next.js"
    }
    p_User -> c_WebApp "Uses"
  }
  views { container sys "Containers" { include * autoLayout lr } }
}
