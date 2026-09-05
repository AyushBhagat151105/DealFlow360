export interface SeedUser {
  id: string;
  email: string;
  name: string;
  role: "rep" | "manager" | "finance" | "admin";
  isDemo?: boolean;
}

export const GUJARAT_USERS: SeedUser[] = [
  // 4 Core Demo Accounts
  {
    id: "usr_demo_rep",
    email: "rep@dealflow360.com",
    name: "Aarav Patel (Demo Rep)",
    role: "rep",
    isDemo: true,
  },
  {
    id: "usr_demo_manager",
    email: "manager@dealflow360.com",
    name: "Bhavik Shah (Demo Manager)",
    role: "manager",
    isDemo: true,
  },
  {
    id: "usr_demo_finance",
    email: "finance@dealflow360.com",
    name: "Pooja Trivedi (Demo Finance)",
    role: "finance",
    isDemo: true,
  },
  {
    id: "usr_demo_admin",
    email: "admin@dealflow360.com",
    name: "Arthur Admin (Demo Admin)",
    role: "admin",
    isDemo: true,
  },

  // 22 Gujarat Sales Representatives
  { id: "usr_rep_01", email: "rohan.mehta@dealflow360.com", name: "Rohan Mehta", role: "rep" },
  { id: "usr_rep_02", email: "priyansh.joshi@dealflow360.com", name: "Priyansh Joshi", role: "rep" },
  { id: "usr_rep_03", email: "sneha.desai@dealflow360.com", name: "Sneha Desai", role: "rep" },
  { id: "usr_rep_04", email: "harshil.bhatt@dealflow360.com", name: "Harshil Bhatt", role: "rep" },
  { id: "usr_rep_05", email: "nidhi.dave@dealflow360.com", name: "Nidhi Dave", role: "rep" },
  { id: "usr_rep_06", email: "chirag.parikh@dealflow360.com", name: "Chirag Parikh", role: "rep" },
  { id: "usr_rep_07", email: "dhruv.solanki@dealflow360.com", name: "Dhruv Solanki", role: "rep" },
  { id: "usr_rep_08", email: "tanvi.vora@dealflow360.com", name: "Tanvi Vora", role: "rep" },
  { id: "usr_rep_09", email: "parth.panchal@dealflow360.com", name: "Parth Panchal", role: "rep" },
  { id: "usr_rep_10", email: "hiral.makwana@dealflow360.com", name: "Hiral Makwana", role: "rep" },
  { id: "usr_rep_11", email: "yash.vyas@dealflow360.com", name: "Yash Vyas", role: "rep" },
  { id: "usr_rep_12", email: "jigar.sanghavi@dealflow360.com", name: "Jigar Sanghavi", role: "rep" },
  { id: "usr_rep_13", email: "meera.kotak@dealflow360.com", name: "Meera Kotak", role: "rep" },
  { id: "usr_rep_14", email: "kevin.kapadia@dealflow360.com", name: "Kevin Kapadia", role: "rep" },
  { id: "usr_rep_15", email: "urvi.choksi@dealflow360.com", name: "Urvi Choksi", role: "rep" },
  { id: "usr_rep_16", email: "rikin.shah@dealflow360.com", name: "Rikin Shah", role: "rep" },
  { id: "usr_rep_17", email: "disha.gandhi@dealflow360.com", name: "Disha Gandhi", role: "rep" },
  { id: "usr_rep_18", email: "mihir.somani@dealflow360.com", name: "Mihir Somani", role: "rep" },
  { id: "usr_rep_19", email: "riddhi.zaveri@dealflow360.com", name: "Riddhi Zaveri", role: "rep" },
  { id: "usr_rep_20", email: "kunal.adani@dealflow360.com", name: "Kunal Adani", role: "rep" },
  { id: "usr_rep_21", email: "mansi.chhaya@dealflow360.com", name: "Mansi Chhaya", role: "rep" },
  { id: "usr_rep_22", email: "tirthraj.jadeja@dealflow360.com", name: "Tirthraj Jadeja", role: "rep" },

  // 6 Gujarat Sales Managers
  { id: "usr_mgr_01", email: "ketan.kothari@dealflow360.com", name: "Ketan Kothari", role: "manager" },
  { id: "usr_mgr_02", email: "alpa.munshaw@dealflow360.com", name: "Alpa Munshaw", role: "manager" },
  { id: "usr_mgr_03", email: "devang.sarabhai@dealflow360.com", name: "Devang Sarabhai", role: "manager" },
  { id: "usr_mgr_04", email: "jagdish.vakil@dealflow360.com", name: "Jagdish Vakil", role: "manager" },
  { id: "usr_mgr_05", email: "shilpa.lalbhai@dealflow360.com", name: "Shilpa Lalbhai", role: "manager" },
  { id: "usr_mgr_06", email: "kaushik.amin@dealflow360.com", name: "Kaushik Amin", role: "manager" },

  // 4 Gujarat Finance Officers
  { id: "usr_fin_01", email: "shailesh.godrej@dealflow360.com", name: "Shailesh Godrej", role: "finance" },
  { id: "usr_fin_02", email: "hemaxi.doshi@dealflow360.com", name: "Hemaxi Doshi", role: "finance" },
  { id: "usr_fin_03", email: "pratik.ambani@dealflow360.com", name: "Pratik Ambani", role: "finance" },
  { id: "usr_fin_04", email: "nehal.munjal@dealflow360.com", name: "Nehal Munjal", role: "finance" },

  // 4 Gujarat System Administrators
  { id: "usr_adm_01", email: "gaurav.pandya@dealflow360.com", name: "Gaurav Pandya", role: "admin" },
  { id: "usr_adm_02", email: "payal.raval@dealflow360.com", name: "Payal Raval", role: "admin" },
  { id: "usr_adm_03", email: "hardik.modi@dealflow360.com", name: "Hardik Modi", role: "admin" },
  { id: "usr_adm_04", email: "sonal.barot@dealflow360.com", name: "Sonal Barot", role: "admin" },
];
