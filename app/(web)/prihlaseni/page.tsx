import { permanentRedirect } from "next/navigation";

export default function PrihlaseniPage() {
  permanentRedirect("/login");
}
