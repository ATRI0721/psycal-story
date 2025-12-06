function get_temp_id() {
  return "temp_" + Math.random().toString(36).slice(2);
}

console.log(get_temp_id());