using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    /// <summary>
    /// Implementación de IUserManagementService utilizando ASP.NET Identity.
    /// </summary>
    public class UserManagementService : IUserManagementService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UserManagementService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<OperationResult<IEnumerable<UserDto>>> GetAllAsync()
        {
            var users = await _userManager.Users
                .OrderBy(u => u.UserName)
                .ToListAsync();

            var dtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                dtos.Add(new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? "",
                    Email = user.Email ?? "",
                    NombreCompleto = user.NombreCompleto,
                    Role = roles.FirstOrDefault() ?? "User",
                    Activo = user.Activo,
                    FechaCreacion = user.FechaCreacion
                });
            }

            return OperationResult<IEnumerable<UserDto>>.Ok(dtos);
        }

        public async Task<OperationResult<UserDto>> GetByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult<UserDto>.Fail("Usuario no encontrado");

            var roles = await _userManager.GetRolesAsync(user);
            var dto = new UserDto
            {
                Id = user.Id,
                Username = user.UserName ?? "",
                Email = user.Email ?? "",
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User",
                Activo = user.Activo,
                FechaCreacion = user.FechaCreacion
            };

            return OperationResult<UserDto>.Ok(dto);
        }

        public async Task<OperationResult> DeactivateAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            if (!user.Activo)
                return OperationResult.Fail("El usuario ya está inactivo");

            user.Activo = false;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return OperationResult.Fail("Error al desactivar usuario");

            return OperationResult.Ok($"Usuario '{user.UserName}' desactivado exitosamente");
        }

        public async Task<OperationResult> ActivateAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            if (user.Activo)
                return OperationResult.Fail("El usuario ya está activo");

            user.Activo = true;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return OperationResult.Fail("Error al activar usuario");

            return OperationResult.Ok($"Usuario '{user.UserName}' activado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return OperationResult.Fail("Error al eliminar usuario");

            return OperationResult.Ok($"Usuario '{user.UserName}' eliminado permanentemente");
        }
    }
}
